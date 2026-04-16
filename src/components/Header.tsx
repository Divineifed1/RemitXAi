'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Volume2, VolumeX, Sun, Moon, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WalletBalance } from './WalletBalance';

interface HeaderProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  isVoiceEnabled: boolean;
  onToggleVoice: () => void;
}

export function Header({ isDarkMode, onToggleTheme, isVoiceEnabled, onToggleVoice }: HeaderProps) {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 px-6 py-4 rounded-b-2xl',
        isDarkMode 
          ? 'bg-[#0B1220]/80 border-b border-white/5' 
          : 'bg-white/80 border-b border-[#BCC3EE]/30'
      )}
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3 ml-0 rounded-lg">
          <Image
            src="/Glow.png"
            alt="RemitX AI Logo"
            width={50}
            height={100}
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

        <div className="flex items-center gap-3">
          <WalletBalance isDarkMode={isDarkMode} showAddress address="GCFX7FJHBM4CYGERTUQJQD5EKQ6CWG6CXKNR6FWKH3VQNR7L3XJSC6OQW" />

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
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}