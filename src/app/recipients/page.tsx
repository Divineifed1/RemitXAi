'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Users, UserPlus, Send, Copy, Check, ArrowRight } from 'lucide-react';
import { Header } from '@/components/Header';
import { cn } from '@/lib/utils';

interface DbRecipient {
  id: number;
  name: string;
  wallet: string;
}

export default function RecipientsPage() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [recipients, setRecipients] = useState<DbRecipient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const fetchRecipients = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/recipients');
      const data = await res.json();
      if (res.ok && data.recipients) {
        setRecipients(data.recipients);
      }
    } catch (error) {
      console.error('Failed to fetch recipients:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCopy = (wallet: string, id: number) => {
    navigator.clipboard.writeText(wallet);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const shortenAddress = (addr: string) => {
    if (!addr || addr.length < 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  };

  const toggleTheme = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled(prev => !prev);
  }, []);

  useEffect(() => {
    fetchRecipients();
  }, [fetchRecipients]);

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className={`
        min-h-screen transition-colors duration-300
        ${isDarkMode ? 'bg-[#0B1220]' : 'bg-slate-50'}
      `}>
        <div className={`
          fixed inset-0 pointer-events-none
          ${isDarkMode
            ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#5160CD]/20 via-[#0B1220] to-[#0B1220]'
            : 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#BCC3EE] via-slate-50 to-slate-50'
          }
        `} />

        <Header
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
          isVoiceEnabled={voiceEnabled}
          onToggleVoice={toggleVoice}
        />

        <div className="fixed top-24 left-6 z-30">
          <Link href="/dashboard">
            <motion.div
              whileHover={{ x: 4 }}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium mt-5 transition-all mb-4',
                isDarkMode
                  ? 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                  : 'bg-slate-100 text-slate-600 hover:text-[#234A80] hover:bg-[#BCC3EE]/20'
              )}
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Back to Dashboard
            </motion.div>
          </Link>
        </div>

        <main className="relative z-10 pt-28 pb-6 px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h1 className={cn(
                'text-3xl font-bold',
                isDarkMode ? 'text-white' : 'text-slate-900'
              )}>
                My Recipients
              </h1>
              <p className={cn(
                'mt-1',
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              )}>
                {recipients.length} saved recipient{recipients.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all',
                  'gradient-bg text-white hover:shadow-lg hover:shadow-[#9B7EE9]/30'
                )}
              >
                <UserPlus className="w-4 h-4" />
                Add Recipient
              </motion.button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={cn(
              'rounded-2xl border backdrop-blur-xl overflow-hidden',
              isDarkMode
                ? 'bg-[#0B1220]/40 border-white/10'
                : 'bg-white/80 border-[#BCC3EE]/30'
            )}
          >
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-pulse space-y-3">
                  {[0, 1, 2].map(i => (
                    <div key={i} className={cn(
                      'h-16 rounded-xl',
                      isDarkMode ? 'bg-slate-700/50' : 'bg-slate-300/30'
                    )}></div>
                  ))}
                </div>
              </div>
            ) : recipients.length === 0 ? (
              <div className="p-8 text-center">
                <Users className={cn(
                  'w-12 h-12 mx-auto mb-3',
                  isDarkMode ? 'text-slate-600' : 'text-slate-400'
                )} />
                <p className={cn(
                  'text-sm',
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                )}>
                  No recipients saved yet. Add one from the chat to get started.
                </p>
              </div>
            ) : (
              <div className="divide-y" style={{
                borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(188,195,238,0.3)',
              }}>
                {recipients.map((recipient) => (
                  <motion.div
                    key={recipient.id}
                    className={cn(
                      'p-4 flex items-center justify-between group transition-colors',
                      isDarkMode
                        ? 'hover:bg-white/5'
                        : 'hover:bg-slate-50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center',
                        isDarkMode ? 'bg-slate-800' : 'bg-slate-200'
                      )}>
                        <Users className="w-5 h-5 text-[#9B7EE9]" />
                      </div>
                      <div>
                        <p className={cn(
                          'font-medium',
                          isDarkMode ? 'text-white' : 'text-slate-900'
                        )}>
                          {recipient.name}
                        </p>
                        <p className={cn(
                          'text-xs font-mono',
                          isDarkMode ? 'text-slate-500' : 'text-slate-400'
                        )}>
                          {shortenAddress(recipient.wallet)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleCopy(recipient.wallet, recipient.id)}
                        className={cn(
                          'p-1.5 rounded-lg transition-colors',
                          isDarkMode
                            ? 'hover:bg-white/10 text-slate-400 hover:text-white'
                            : 'hover:bg-slate-200 text-slate-500 hover:text-slate-700'
                        )}
                        title="Copy wallet address"
                      >
                        {copiedId === recipient.id ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </motion.button>

                      <Link href={`/?send=${encodeURIComponent(recipient.name)}`}>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className={cn(
                            'p-1.5 rounded-lg transition-colors',
                            isDarkMode
                              ? 'hover:bg-white/10 text-slate-400 hover:text-white'
                              : 'hover:bg-slate-200 text-slate-500 hover:text-slate-700'
                          )}
                          title="Send money to this recipient"
                        >
                          <Send className="w-4 h-4" />
                        </motion.button>
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
