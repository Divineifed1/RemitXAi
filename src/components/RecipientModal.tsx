'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecipientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, walletAddress: string) => void;
  isDarkMode: boolean;
  defaultName?: string;
  defaultWallet?: string;
}

export function RecipientModal({ 
  isOpen, 
  onClose, 
  onSave, 
  isDarkMode,
  defaultName = '',
  defaultWallet = ''
}: RecipientModalProps) {
  const [name, setName] = useState(defaultName);
  const [walletAddress, setWalletAddress] = useState(defaultWallet);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && walletAddress.trim()) {
      onSave(name.trim(), walletAddress.trim());
      setName('');
      setWalletAddress('');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={cn(
              'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md p-6 rounded-2xl border',
              isDarkMode
                ? 'bg-[#0B1220] border-white/10 shadow-2xl shadow-[#9B7EE9]/20'
                : 'bg-white border-[#BCC3EE]/30 shadow-2xl shadow-[#9B7EE9]/10'
            )}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className={cn(
                'text-xl font-semibold',
                isDarkMode ? 'text-white' : 'text-slate-900'
              )}>
                Add Recipient
              </h2>
              <button
                onClick={onClose}
                className={cn(
                  'p-2 rounded-full transition-colors',
                  isDarkMode 
                    ? 'hover:bg-white/10 text-slate-400 hover:text-white' 
                    : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'
                )}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                )}>
                  <User className="w-4 h-4 inline mr-2" />
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., John"
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all',
                    isDarkMode
                      ? 'bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-[#9B7EE9]'
                      : 'bg-white border-[#BCC3EE]/30 text-slate-900 placeholder:text-slate-400 focus:border-[#9B7EE9]'
                  )}
                />
              </div>

              <div>
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                )}>
                  <Wallet className="w-4 h-4 inline mr-2" />
                  Wallet Address
                </label>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="e.g., GCFX123456789..."
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all',
                    isDarkMode
                      ? 'bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-[#9B7EE9]'
                      : 'bg-white border-[#BCC3EE]/30 text-slate-900 placeholder:text-slate-400 focus:border-[#9B7EE9]'
                  )}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className={cn(
                    'flex-1 py-3 rounded-xl font-medium transition-all',
                    isDarkMode
                      ? 'bg-white/5 text-slate-300 hover:bg-white/10'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!name.trim() || !walletAddress.trim()}
                  className={cn(
                    'flex-1 py-3 rounded-xl font-medium transition-all gradient-bg text-white',
                    (!name.trim() || !walletAddress.trim()) && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  Save Recipient
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}