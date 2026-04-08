'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MessageSquare, LayoutDashboard, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationProps {
  isDarkMode: boolean;
  isVoiceEnabled: boolean;
  onToggleVoice: () => void;
  onToggleTheme: () => void;
}

const navItems = [
  { href: '/', label: 'Chat', icon: MessageSquare },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

export function Navigation({ isDarkMode, isVoiceEnabled, onToggleVoice, onToggleTheme }: NavigationProps) {
  const pathname = usePathname();

  return (
    <motion.nav
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={cn(
        'fixed left-0 top-0 bottom-0 w-64 z-40 border-r flex flex-col',
        isDarkMode 
          ? 'bg-[#0B1220]/95 border-white/5' 
          : 'bg-white/95 border-[#BCC3EE]/30'
      )}
    >
      <div className="p-4 flex items-center gap-3 border-b border-inherit">
        <div className="relative w-10 h-10 shrink-0">
          <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">
            <span className="gradient-text">RemitX</span>
          </h1>
          <p className={cn(
            'text-xs',
            isDarkMode ? 'text-slate-500' : 'text-slate-400'
          )}>
            AI Payments
          </p>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 4 }}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                  isActive
                    ? 'gradient-bg text-white shadow-lg shadow-[#9B7EE9]/30'
                    : isDarkMode
                      ? 'text-slate-400 hover:text-white hover:bg-white/5'
                      : 'text-slate-600 hover:text-[#234A80] hover:bg-[#BCC3EE]/20'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-inherit">
        <div className="flex items-center justify-between">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleVoice}
            className={cn(
              'p-2 rounded-lg transition-colors',
              isDarkMode 
                ? 'hover:bg-white/10 text-slate-400 hover:text-white' 
                : 'hover:bg-[#BCC3EE]/30 text-slate-500 hover:text-[#234A80]'
            )}
            title={isVoiceEnabled ? 'Disable voice output' : 'Enable voice output'}
          >
            {isVoiceEnabled ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleTheme}
            className={cn(
              'p-2 rounded-lg transition-colors',
              isDarkMode 
                ? 'hover:bg-white/10 text-slate-400 hover:text-white' 
                : 'hover:bg-[#BCC3EE]/30 text-slate-500 hover:text-[#234A80]'
            )}
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
}