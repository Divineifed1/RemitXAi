'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Volume2, VolumeX, Sun, Moon, LayoutDashboard, LogIn, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WalletBalance } from './WalletBalance';
import { NotificationBell } from './NotificationBell';
import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  isVoiceEnabled: boolean;
  onToggleVoice: () => void;
}

export function Header({ isDarkMode, onToggleTheme, isVoiceEnabled, onToggleVoice }: HeaderProps) {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 px-3 py-3 sm:px-6 sm:py-4 rounded-b-2xl',
        isDarkMode 
          ? 'bg-[#0B1220]/80 border-b border-white/5' 
          : 'bg-white/80 border-b border-[#BCC3EE]/30'
      )}
    >
      <div className="max-w-4xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-center gap-3 sm:justify-start rounded-lg">
          <Image
            src="/Glow.png"
            alt="RemitX AI Logo"
            width={50}
            height={50}
            unoptimized
          />
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              <span className="gradient-text">RemitX</span>
              <span className={isDarkMode ? 'text-white' : 'text-slate-900'}> AI</span>
            </h1>
            <p className={cn(
              'text-xs',
              isDarkMode ? 'text-slate-500' : 'text-slate-400'
            )}>
              AI-Powered Cross-Border Payments
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="min-w-0 flex-1 sm:flex-none">
            <WalletBalance isDarkMode={isDarkMode} showAddress address="GCFX7FJHBM4CYGERTUQJQD5EKQ6CWG6CXKNR6FWKH3VQNR7L3XJSC6OQW" />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/dashboard">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  isDarkMode
                    ? 'hover:bg-white/10 text-slate-400 hover:text-white'
                    : 'hover:bg-[#BCC3EE]/30 text-slate-500 hover:text-[#234A80]'
                )}
                title="Go to Dashboard"
              >
                <LayoutDashboard className="w-5 h-5" />
              </motion.button>
            </Link>

            <NotificationBell isDarkMode={isDarkMode} />

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
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSignOut}
              className={cn(
                'p-2 rounded-lg transition-colors',
                isDarkMode 
                  ? 'hover:bg-white/10 text-slate-400 hover:text-white' 
                  : 'hover:bg-[#BCC3EE]/30 text-slate-500 hover:text-[#234A80]'
              )}
              title={user ? 'Sign out' : 'Sign in'}
            >
              {user ? (
                <LogOut className="w-5 h-5" />
              ) : (
                <LogIn className="w-5 h-5" />
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}