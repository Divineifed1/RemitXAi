'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, TrendingUp, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Alert } from '@/types';

interface ToastProps {
  alerts: Alert[];
  onDismiss: (id: string) => void;
  isDarkMode: boolean;
}

export function Toast({ alerts, onDismiss, isDarkMode }: ToastProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {alerts.filter(a => !a.read).map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            className={cn(
              'p-4 rounded-2xl border shadow-lg backdrop-blur-xl',
              isDarkMode
                ? 'bg-[#0B1220]/90 border-white/10'
                : 'bg-white/90 border-[#BCC3EE]/30'
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                alert.type === 'incoming' 
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : alert.type === 'insight'
                    ? 'bg-[#9B7EE9]/20 text-[#9B7EE9]'
                    : 'bg-amber-500/20 text-amber-400'
              )}>
                {alert.type === 'incoming' ? (
                  <Bell className="w-5 h-5" />
                ) : alert.type === 'insight' ? (
                  <TrendingUp className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={cn(
                  'font-semibold text-sm',
                  isDarkMode ? 'text-white' : 'text-slate-900'
                )}>
                  {alert.title}
                </h4>
                <p className={cn(
                  'text-xs mt-1',
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                )}>
                  {alert.message}
                </p>
              </div>
              <button
                onClick={() => onDismiss(alert.id)}
                className={cn(
                  'p-1 rounded-lg transition-colors shrink-0',
                  isDarkMode 
                    ? 'hover:bg-white/10 text-slate-500' 
                    : 'hover:bg-slate-100 text-slate-400'
                )}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}