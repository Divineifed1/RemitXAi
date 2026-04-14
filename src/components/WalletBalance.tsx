'use client';

import { motion } from 'framer-motion';
import { Wallet } from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { cn } from '@/lib/utils';

interface WalletBalanceProps {
  isDarkMode?: boolean;
  showLabel?: boolean;
}

export function WalletBalance({ isDarkMode = true, showLabel = true }: WalletBalanceProps) {
  const { balance, isLoading } = useWallet();

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      key={balance}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-2xl',
        isDarkMode
          ? 'bg-gradient-to-r from-[#234A80] to-[#9B7EE9]'
          : 'bg-gradient-to-r from-[#234A80] to-[#9B7EE9]'
      )}
    >
      <Wallet className="w-4 h-4 text-white" />
      <span className="text-white font-bold">
        {isLoading ? (
          <span className="animate-pulse">...</span>
        ) : (
          <motion.span
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="tabular-nums"
          >
            ${balance.toLocaleString()}
          </motion.span>
        )}
      </span>
    </motion.div>
  );
}