'use client';

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Message } from '@/types';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';

interface ChatContainerProps {
  messages: Message[];
  isDarkMode: boolean;
  isTyping: boolean;
  onConfirmPayment?: () => void;
  onCancelPayment?: () => void;
}

export function ChatContainer({ messages, isDarkMode, isTyping, onConfirmPayment, onCancelPayment }: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div
      className={cn(
        'flex-1 overflow-y-auto px-4 py-6 space-y-4 scrollbar-thin',
        isDarkMode
          ? 'scrollbar-thumb-slate-700 scrollbar-track-transparent'
          : 'scrollbar-thumb-slate-300 scrollbar-track-transparent'
      )}
    >
      <AnimatePresence>
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full min-h-[300px] text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className={cn(
                'w-20 h-20 rounded-2xl flex items-center justify-center mb-4',
                isDarkMode
                  ? 'bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30'
                  : 'bg-gradient-to-br from-indigo-100 to-cyan-100 border border-indigo-200'
              )}
            >
              <span className="text-4xl">🤖</span>
            </motion.div>
            <h2 className={cn(
              'text-xl font-semibold mb-2 gradient-text'
            )}>
              Welcome to RemitX AI
            </h2>
            <p className={cn(
              'text-sm max-w-xs',
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            )}>
              Send money or convert currencies using voice or text. Try saying "Send $50 to John" or "Convert $100 to Naira"
            </p>
          </motion.div>
        )}

        {messages.map((message) => (
          <ChatMessage 
            key={message.id} 
            message={message} 
            isDarkMode={isDarkMode}
            onConfirmPayment={onConfirmPayment}
            onCancelPayment={onCancelPayment}
          />
        ))}

        {isTyping && (
          <TypingIndicator isDarkMode={isDarkMode} />
        )}
      </AnimatePresence>

      <div ref={messagesEndRef} />
    </div>
  );
}