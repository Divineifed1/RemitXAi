'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import { ChatContainer } from '@/components/ChatContainer';
import { ChatInput } from '@/components/ChatInput';
import { QuickActionButtons } from '@/components/QuickActionButtons';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import type { Message, IntentResult, TransactionData, ConversionData } from '@/types';

const EXCHANGE_RATES: Record<string, number> = {
  'USD-NGN': 1500,
  'USD-GBP': 0.79,
  'USD-EUR': 0.92,
  'USD-JPY': 148.5,
};

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

function detectIntent(text: string): IntentResult {
  const lowerText = text.toLowerCase();
  
  const sendMatch = lowerText.match(/send\s+\$?(\d+)\s+(?:to\s+)?(\w+)/i);
  if (sendMatch) {
    return {
      type: 'send_money',
      data: {
        amount: parseInt(sendMatch[1], 10),
        recipient: sendMatch[2],
      },
    };
  }
  
  const convertMatch = lowerText.match(/convert\s+\$?(\d+)\s+(?:from\s+)?(\w+)?\s+(?:to\s+)?(\w+)/i);
  if (convertMatch) {
    return {
      type: 'convert_currency',
      data: {
        amount: parseInt(convertMatch[1], 10),
        fromCurrency: convertMatch[2] || 'USD',
        toCurrency: convertMatch[3],
      },
    };
  }
  
  const quickConvertMatch = lowerText.match(/(\w+)\s+to\s+(\w+)/i);
  if (quickConvertMatch && EXCHANGE_RATES[`USD-${quickConvertMatch[2].toUpperCase()}`]) {
    return {
      type: 'convert_currency',
      data: {
        amount: 100,
        fromCurrency: 'USD',
        toCurrency: quickConvertMatch[2].toUpperCase(),
      },
    };
  }
  
  return { type: 'unknown' };
}

function processAIResponse(userMessage: string): Message {
  const intent = detectIntent(userMessage);
  
  if (intent.type === 'send_money' && intent.data) {
    const { amount, recipient } = intent.data;
    const transactionData: TransactionData = {
      recipient: recipient!,
      amount: amount!,
      currency: '$',
      status: 'pending',
    };
    
    return {
      id: generateId(),
      role: 'ai',
      content: `Initiating transfer of $${amount} to ${recipient}...`,
      timestamp: new Date(),
      type: 'transaction',
      transactionData,
    };
  }
  
  if (intent.type === 'convert_currency' && intent.data) {
    const { amount, fromCurrency, toCurrency } = intent.data;
    const rate = EXCHANGE_RATES[`${fromCurrency?.toUpperCase()}-${toCurrency?.toUpperCase()}`] || 1;
    const toAmount = (amount || 100) * rate;
    
    const conversionData: ConversionData = {
      fromAmount: amount || 100,
      fromCurrency: fromCurrency?.toUpperCase() || 'USD',
      toAmount: Math.round(toAmount * 100) / 100,
      toCurrency: toCurrency?.toUpperCase() || toCurrency?.toUpperCase() || 'NGN',
      rate,
    };
    
    return {
      id: generateId(),
      role: 'ai',
      content: `Converting ${conversionData.fromAmount} ${conversionData.fromCurrency} to ${conversionData.toCurrency}...`,
      timestamp: new Date(),
      type: 'conversion',
      conversionData,
    };
  }
  
  const responses = [
    "I can help you send money or convert currencies. Try saying 'Send $50 to John' or 'Convert $100 to Naira'",
    "I understand you want to make a transaction. For sending money, say 'Send $50 to John'. For conversion, say 'Convert $100 to Euro'",
    "I'm here to help with cross-border payments. Would you like to send money or convert currency?",
  ];
  
  return {
    id: generateId(),
    role: 'ai',
    content: responses[Math.floor(Math.random() * responses.length)],
    timestamp: new Date(),
  };
}

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const { speak } = useSpeechSynthesis();

  const handleToggleTheme = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  const handleToggleVoice = useCallback(() => {
    setVoiceEnabled(prev => !prev);
  }, []);

  const handleSendMessage = useCallback((content: string) => {
    if (!content.trim()) return;
    
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    
    const delay = 800 + Math.random() * 700;
    
    setTimeout(() => {
      const aiResponse = processAIResponse(content);
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
      
      if (voiceEnabled && aiResponse.content) {
        speak(aiResponse.content);
      }
    }, delay);
  }, [voiceEnabled, speak]);

  const handleQuickAction = useCallback((command: string) => {
    handleSendMessage(command);
  }, [handleSendMessage]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('remitx-dark-mode');
    if (savedTheme !== null) {
      setIsDarkMode(savedTheme === 'true');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('remitx-dark-mode', String(isDarkMode));
  }, [isDarkMode]);

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className={`
        min-h-screen transition-colors duration-300
        ${isDarkMode 
          ? 'bg-[#0B1220]' 
          : 'bg-slate-50'
        }
      `}>
        <div className={`
          fixed inset-0 pointer-events-none
          ${isDarkMode 
            ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#5160CD]/20 via-[#0B1220] to-[#0B1220]' 
            : 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#BCC3EE] via-slate-50 to-slate-50'
          }
        `}>
          <div className={`
            absolute inset-0 animate-pulse
            ${isDarkMode 
              ? 'bg-[radial-gradient(circle_at_50%_0%,rgba(78,186,242,0.15),transparent_50%)]' 
              : 'bg-[radial-gradient(circle_at_50%_0%,rgba(78,186,242,0.1),transparent_50%)]'
            }
          `} />
        </div>

        <Header
          isDarkMode={isDarkMode}
          onToggleTheme={handleToggleTheme}
          isVoiceEnabled={voiceEnabled}
          onToggleVoice={handleToggleVoice}
        />

        <main className="relative z-10 pt-24 pb-6 px-4 max-w-2xl mx-auto min-h-screen flex flex-col">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`
              flex-1 rounded-3xl border backdrop-blur-xl overflow-hidden
              ${isDarkMode 
                ? 'bg-[#0B1220]/40 border-white/10 shadow-2xl shadow-[#9B7EE9]/10' 
                : 'bg-white/80 border-[#BCC3EE]/30 shadow-xl shadow-[#9B7EE9]/5'
              }
            `}
          >
            <ChatContainer
              messages={messages}
              isDarkMode={isDarkMode}
              isTyping={isTyping}
            />

            <div className="p-4 border-t border-inherit">
              <QuickActionButtons
                onAction={handleQuickAction}
                isDarkMode={isDarkMode}
              />
              <div className="mt-3">
                <ChatInput
                  onSubmit={handleSendMessage}
                  isDarkMode={isDarkMode}
                  isVoiceEnabled={voiceEnabled}
                />
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}