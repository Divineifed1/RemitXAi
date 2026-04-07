'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, XCircle, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TransactionData } from '@/types';

interface TransactionCardProps {
  data: TransactionData;
  isDarkMode: boolean;
}

export function TransactionCard({ data, isDarkMode }: TransactionCardProps) {
  const [status, setStatus] = useState<'pending' | 'success' | 'failed'>(data.status);

  useEffect(() => {
    if (data.status === 'pending') {
      const timer = setTimeout(() => {
        setStatus('success');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [data.status]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className={cn(
        'rounded-2xl p-4 border transition-all duration-500',
        isDarkMode
          ? 'bg-black/40 border-white/10'
          : 'bg-white border-[#BCC3EE] shadow-md'
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            isDarkMode ? 'bg-[#5160CD]/20' : 'bg-[#5160CD]/10'
          )}>
            <ArrowUpRight className={cn(
              'w-4 h-4',
              isDarkMode ? 'text-[#4EBAF2]' : 'text-[#5160CD]'
            )} />
          </div>
          <div>
            <div className={cn(
              'text-xs',
              isDarkMode ? 'text-slate-500' : 'text-slate-500'
            )}>
              Sending to
            </div>
            <div className={cn(
              'font-semibold text-sm',
              isDarkMode ? 'text-white' : 'text-slate-900'
            )}>
              {data.recipient}
            </div>
          </div>
        </div>
        
        <div className={cn(
          'font-bold text-lg',
          isDarkMode ? 'text-white' : 'text-slate-900'
        )}>
          {data.currency}{data.amount.toLocaleString()}
        </div>
      </div>

      <motion.div 
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
          status === 'pending' && (isDarkMode ? 'bg-[#5160CD]/10 text-[#4EBAF2]' : 'bg-[#5160CD]/10 text-[#5160CD]'),
          status === 'success' && (isDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'),
          status === 'failed' && (isDarkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600')
        )}
        animate={status === 'pending' ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 2, repeat: status === 'pending' ? Infinity : 0 }}
      >
        {status === 'pending' && (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Clock className="w-4 h-4" />
            </motion.div>
            Processing...
          </>
        )}
        {status === 'success' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            >
              <CheckCircle className="w-4 h-4" />
            </motion.div>
            Payment Successful
          </>
        )}
        {status === 'failed' && (
          <>
            <XCircle className="w-4 h-4" />
            Payment Failed
          </>
        )}
      </motion.div>

      {status === 'success' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={cn(
            'text-xs mt-2',
            isDarkMode ? 'text-slate-500' : 'text-slate-400'
          )}
        >
          Transaction ID: TXN{Math.random().toString(36).substring(2, 10).toUpperCase()}
        </motion.div>
      )}
    </motion.div>
  );
}