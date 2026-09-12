'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { NotificationRow } from '@/lib/supabase-db';
import { supabaseAdmin } from '@/lib/supabase';

interface NotificationCenterContextType {
  notifications: NotificationRow[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  addNotification: (notification: {
    title: string;
    message: string;
    type: 'incoming' | 'insight' | 'warning' | 'transaction';
    actionUrl?: string;
    metadata?: Record<string, any>;
  }) => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  clearUnreadCount: () => void;
}

const NotificationCenterContext = createContext<NotificationCenterContextType | undefined>(undefined);

export function NotificationCenterProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<any>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } else {
        setError(data.error || 'Failed to fetch notifications');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addNotification = useCallback(async (notification: {
    title: string;
    message: string;
    type: 'incoming' | 'insight' | 'warning' | 'transaction';
    actionUrl?: string;
    metadata?: Record<string, any>;
  }) => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notification),
      });
      await fetchNotifications();
    } catch (err) {
      console.error('Failed to add notification:', err);
    }
  }, [fetchNotifications]);

  const markRead = useCallback(async (id: number) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read', id }),
      });
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, status: 'read' } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  }, []);

  const clearUnreadCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    fetchNotifications();

    if (supabaseAdmin) {
      const channel = supabaseAdmin.channel('public:notifications');

      channel.on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload: any) => {
          const newNotif: NotificationRow = payload.new;
          setNotifications(prev => [newNotif, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      );

      channel.on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications' },
        (payload: any) => {
          const updated: NotificationRow = payload.new;
          setNotifications(prev =>
            prev.map(n => (n.id === updated.id ? updated : n))
          );
          if (updated.status === 'read') {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      );

      channel.subscribe();
      channelRef.current = channel;
    }

    return () => {
      if (channelRef.current && supabaseAdmin) {
        supabaseAdmin.removeChannel(channelRef.current);
      }
    };
  }, [fetchNotifications]);

  return (
    <NotificationCenterContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        error,
        addNotification,
        markRead,
        markAllRead,
        fetchNotifications,
        clearUnreadCount,
      }}
    >
      {children}
    </NotificationCenterContext.Provider>
  );
}

export function useNotificationCenter() {
  const context = useContext(NotificationCenterContext);
  if (!context) {
    throw new Error('useNotificationCenter must be used within a NotificationCenterProvider');
  }
  return context;
}
