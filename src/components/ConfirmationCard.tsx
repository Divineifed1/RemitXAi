'use client';

import { motion } from 'framer-motion';
import { Check, X, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmationCardProps {
  recipientName: string;
  walletAddress: string;
  amount: number;
  currency: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDarkMode: boolean;
}

export function ConfirmationCard({
  recipientName,
  walletAddress,
  amount,
  currency,
  onConfirm,
  onCancel,
  isDarkMode,
}: ConfirmationCardProps) {
  const shortWallet = walletAddress.length > 12 
    ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-4)}`
    : walletAddress;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'mt-3 p-4 rounded-xl border',
        isDarkMode
          ? 'bg-amber-500/10 border-amber-500/20'
          : 'bg-amber-50 border-amber-200'
      )}
    >
      <div className={cn(
        'text-sm font-medium mb-3',
        isDarkMode ? 'text-amber-400' : 'text-amber-700'
      )}>
        Confirm Transaction
      </div>
      
      <div className="flex items-center gap-3 mb-4">
        <div className={cn(
          'w-12 h-12 rounded-full flex items-center justify-center',
          isDarkMode ? 'bg-[#234A80]/30' : 'bg-[#234A80]/10'
        )}>
          <span className="text-lg font-semibold text-[#234A80]">
            {recipientName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1">
          <div className={cn(
            'font-semibold',
            isDarkMode ? 'text-white' : 'text-slate-900'
          )}>
            {recipientName}
          </div>
          <div className={cn(
            'text-xs flex items-center gap-1',
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          )}>
            <Wallet className="w-3 h-3" />
            {shortWallet}
          </div>
        </div>
        <div className={cn(
          'text-xl font-bold',
          isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
        )}>
          {currency}{amount}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
            isDarkMode
              ? 'bg-white/5 text-slate-300 hover:bg-white/10'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          )}
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all gradient-bg text-white hover:shadow-lg hover:shadow-[#9B7EE9]/30'
          )}
        >
          <Check className="w-4 h-4" />
          Confirm
        </button>
      </div>
    </motion.div>
  );
}