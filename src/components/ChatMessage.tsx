'use client';

import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message } from '@/types';
import { TransactionCard } from './TransactionCard';

interface ChatMessageProps {
  message: Message;
  isDarkMode: boolean;
}

export function ChatMessage({ message, isDarkMode }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}
    >
      {!isUser && (
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center shrink-0 gradient-bg'
        )}>
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}

      <div className={cn('max-w-[75%]', isUser && 'text-right')}>
        <div className={cn(
          'px-4 py-3 rounded-2xl text-sm leading-relaxed',
          isUser
            ? 'bg-[#234A80] text-white rounded-br-md'
            : isDarkMode
              ? 'gradient-bg text-white rounded-bl-md shadow-lg glow-purple'
              : 'gradient-bg text-white rounded-bl-md shadow-lg'
        )}>
          {message.content}
        </div>

        {message.type === 'transaction' && message.transactionData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-2"
          >
            <TransactionCard 
              data={message.transactionData} 
              isDarkMode={isDarkMode} 
            />
          </motion.div>
        )}

        {message.type === 'conversion' && message.conversionData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-2"
          >
            <div className={cn(
              'px-4 py-3 rounded-xl text-sm',
              isDarkMode
                ? 'bg-emerald-500/10 border border-emerald-500/20'
                : 'bg-emerald-50 border border-emerald-200'
            )}>
              <div className={cn(
                'font-semibold',
                isDarkMode ? 'text-emerald-400' : 'text-emerald-700'
              )}>
                Conversion Complete
              </div>
              <div className={cn(
                'mt-1',
                isDarkMode ? 'text-emerald-300/80' : 'text-emerald-600'
              )}>
                {message.conversionData.fromAmount} {message.conversionData.fromCurrency} = {message.conversionData.toAmount.toLocaleString()} {message.conversionData.toCurrency}
              </div>
              <div className={cn(
                'text-xs mt-1',
                isDarkMode ? 'text-emerald-400/60' : 'text-emerald-500/70'
              )}>
                Exchange rate: 1 {message.conversionData.fromCurrency} = {message.conversionData.rate} {message.conversionData.toCurrency}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {isUser && (
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[#234A80]'
        )}>
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </motion.div>
  );
}