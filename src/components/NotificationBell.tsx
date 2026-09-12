'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellDot, Check, ExternalLink, TrendingUp, AlertCircle, ArrowDownLeft } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useNotificationCenter } from '@/context/NotificationCenterContext';

interface NotificationBellProps {
  isDarkMode: boolean;
}

export function NotificationBell({ isDarkMode }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markRead, markAllRead, clearUnreadCount } = useNotificationCenter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleBellClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      clearUnreadCount();
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'transaction':
        return <ArrowDownLeft className="w-4 h-4" />;
      case 'insight':
        return <TrendingUp className="w-4 h-4" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'transaction':
        return isDarkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600';
      case 'insight':
        return isDarkMode ? 'bg-[#9B7EE9]/20 text-[#9B7EE9]' : 'bg-[#9B7EE9]/10 text-[#9B7EE9]';
      case 'warning':
        return isDarkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600';
      default:
        return isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const recentNotifications = notifications.slice(0, 8);

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleBellClick}
        className={cn(
          'relative p-2 rounded-lg transition-colors',
          isDarkMode
            ? 'hover:bg-white/10 text-slate-400 hover:text-white'
            : 'hover:bg-[#BCC3EE]/30 text-slate-500 hover:text-[#234A80]'
        )}
        title="Notifications"
      >
        {unreadCount > 0 ? (
          <BellDot className="w-5 h-5" />
        ) : (
          <Bell className="w-5 h-5" />
        )}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={cn(
              'absolute -top-1 -right-1 flex items-center justify-center text-xs font-bold rounded-full min-w-[20px] h-5 px-1',
              isDarkMode
                ? 'bg-[#9B7EE9] text-[#0B1220]'
                : 'bg-[#234A80] text-white'
            )}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute top-full right-0 mt-2 w-80 sm:w-96 rounded-2xl border shadow-xl backdrop-blur-xl z-50 overflow-hidden',
              isDarkMode
                ? 'bg-[#0B1220]/95 border-white/10'
                : 'bg-white/95 border-[#BCC3EE]/30'
            )}
          >
            <div className="flex items-center justify-between p-3 sm:p-4 border-b"
              style={{
                borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(188,195,238,0.3)',
              }}
            >
              <h3 className={cn(
                'font-semibold text-sm',
                isDarkMode ? 'text-white' : 'text-slate-900'
              )}>
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className={cn(
                    'text-xs font-medium px-2 py-1 rounded-lg transition-colors',
                    isDarkMode
                      ? 'hover:bg-white/10 text-slate-400 hover:text-white'
                      : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'
                  )}
                  title="Mark all as read"
                >
                  <Check className="w-3 h-3 inline mr-1" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {recentNotifications.length === 0 ? (
                <div className="p-4 text-center text-sm"
                  style={{ color: isDarkMode ? 'rgba(148,163,184,0.7)' : 'rgba(100,116,122,0.7)' }}
                >
                  No notifications yet
                </div>
              ) : (
                recentNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => {
                      if (notification.status === 'unread') {
                        markRead(notification.id);
                      }
                    }}
                    className={cn(
                      'p-3 sm:p-4 border-b cursor-pointer transition-colors',
                      isDarkMode
                        ? 'border-white/5 hover:bg-white/5'
                        : 'border-[#BCC3EE]/20 hover:bg-slate-50',
                      notification.status === 'unread'
                        ? isDarkMode
                          ? 'bg-[#234A80]/10'
                          : 'bg-[#234A80]/5'
                        : ''
                    )}
                  >
                    <div className="flex gap-3">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                        getIconBg(notification.type)
                      )}>
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'text-sm font-medium',
                          isDarkMode ? 'text-white' : 'text-slate-900',
                          notification.status === 'unread' ? 'font-semibold' : ''
                        )}>
                          {notification.title}
                        </p>
                        <p className={cn(
                          'text-xs mt-0.5 line-clamp-2',
                          isDarkMode ? 'text-slate-400' : 'text-slate-600'
                        )}>
                          {notification.message}
                        </p>
                        <p className={cn(
                          'text-xs mt-1',
                          isDarkMode ? 'text-slate-500' : 'text-slate-500'
                        )}>
                          {formatTime(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {recentNotifications.length > 0 && (
              <div className="p-2 sm:p-3 border-t text-center"
                style={{
                  borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(188,195,238,0.3)',
                }}
              >
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center justify-center gap-1 text-xs font-medium py-1 rounded-lg transition-colors',
                    isDarkMode
                      ? 'text-[#9B7EE9] hover:bg-white/10'
                      : 'text-[#234A80] hover:bg-[#BCC3EE]/30'
                  )}
                >
                  View all notifications
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
