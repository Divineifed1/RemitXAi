'use client';

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

export function WalletBalance({ isDarkMode = true, showLabel = true, showAddress = false, address = 'GBC4URMCFRFIDUXH2C4OQ2Z2SPAJGWBVPAVDCXSZF4FNA7WQRLALVGGJ' }: WalletBalanceProps) {
  const { balance, xlmBalance, usdcBalance, isLoading } = useWallet();
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
    <div
      key={address}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-2xl cursor-pointer',
        isDarkMode
          ? 'bg-gradient-to-r from-[#234A80] to-[#9B7EE9]'
          : 'bg-gradient-to-r from-[#234A80] to-[#9B7EE9]'
      )}
      onClick={handleCopy}
      title={showAddress ? "Click to copy address" : "Click to copy"}
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
          <span className="text-white font-bold tabular-nums">
            {isLoading ? (
              <span className="animate-pulse">...</span>
            ) : (
              <span>
                {usdcBalance && Number(parseFloat(usdcBalance)) > 0
                  ? `${Number(parseFloat(usdcBalance).toFixed(2)).toLocaleString()} USDC`
                  : '0 USDC'}
                {(xlmBalance && Number(xlmBalance) > 0) && (
                  <span className="text-xs ml-1 opacity-80">
                    {' '}
                    ({Number(parseFloat(xlmBalance).toFixed(2)).toLocaleString()} XLM)
                  </span>
                )}
              </span>
            )}
          </span>
        </>
      )}
    </div>
  );
}