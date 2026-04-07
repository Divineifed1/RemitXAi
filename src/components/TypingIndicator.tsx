'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  isDarkMode: boolean;
}

export function TypingIndicator({ isDarkMode }: TypingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex items-center gap-1 px-4 py-3 rounded-2xl max-w-[200px]',
        isDarkMode 
          ? 'bg-white/5 border border-white/10' 
          : 'bg-white border border-slate-200 shadow-sm'
      )}
    >
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -5, 0],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
            className={cn(
              'w-2 h-2 rounded-full',
              isDarkMode ? 'bg-slate-500' : 'bg-slate-400'
            )}
          />
        ))}
      </div>
      <span className={cn(
        'text-xs ml-2',
        isDarkMode ? 'text-slate-500' : 'text-slate-400'
      )}>
        AI is thinking
      </span>
    </motion.div>
  );
}