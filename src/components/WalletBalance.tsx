'use client';

import { motion } from 'framer-motion';
import { Wallet, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { cn } from '@/lib/utils';

interface WalletBalanceProps {
  isDarkMode?: boolean;
  showLabel?: boolean;
  showAddress?: boolean;
  address?: string;
}

export function WalletBalance({ isDarkMode = true, showLabel = true, showAddress = false, address = 'GCFX7FJHBM4CYGERTUQJQD5EKQ6CWG6CXKNR6FWKH3VQNR7L3XJSC6OQW' }: WalletBalanceProps) {
  const { balance, isLoading } = useWallet();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shortAddress = address.length > 12 
    ? `${address.slice(0, 8)}...${address.slice(-4)}`
    : address;

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      key={address}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-2xl cursor-pointer',
        isDarkMode
          ? 'bg-gradient-to-r from-[#234A80] to-[#9B7EE9]'
          : 'bg-gradient-to-r from-[#234A80] to-[#9B7EE9]'
      )}
      onClick={handleCopy}
      title="Click to copy"
    >
      {showAddress ? (
        <>
          <Wallet className="w-3 h-3 text-white/80" />
          <span className="text-white text-xs font-mono">
            {shortAddress}
          </span>
          {copied ? (
            <Check className="w-3 h-3 text-emerald-300" />
          ) : (
            <Copy className="w-3 h-3 text-white/60" />
          )}
        </>
      ) : (
        <>
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
        </>
      )}
    </motion.div>
  );
}