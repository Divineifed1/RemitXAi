'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/Header';
import { ChatContainer } from '@/components/ChatContainer';
import { ChatInput } from '@/components/ChatInput';
import { QuickActionButtons } from '@/components/QuickActionButtons';
import { RecipientModal } from '@/components/RecipientModal';
import { Toast } from '@/components/Toast';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { useWallet } from '@/context/WalletContext';
import { useAuth } from '@/context/AuthContext';
import { useNotificationCenter } from '@/context/NotificationCenterContext';
import { cn } from '@/lib/utils';
import type { Message, IntentResult, TransactionData, ConversionData, Recipient, ChatState, ConfirmationData, Alert, Transaction } from '@/types';

const DEFAULT_RECIPIENTS: Recipient[] = [
  { id: '1', name: 'John', walletAddress: 'GCFX1827394710' },
  { id: '2', name: 'Divine', walletAddress: 'GCFX2983746510' },
  { id: '3', name: 'Sarah', walletAddress: 'GCFX4738291028' },
  { id: '4', name: 'David', walletAddress: 'GCFX9283746510' },
];

const SAMPLE_SENDERS = ['Sarah', 'John', 'David', 'Divine', 'Michael'];

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

async function parseIntent(text: string): Promise<IntentResult> {
  try {
    const response = await fetch('/backend/ai/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }),
    });

    if (!response.ok) {
      console.error('[AI Parse] HTTP error:', response.status);
      return { type: 'unknown' };
    }

    const data = await response.json();
    console.log('[AI Parse] Response:', data);

    if (data.error) {
      console.error('[AI Parse] Error:', data.error);
      return { type: 'unknown' };
    }

    const action = data.action;
    const amount = data.amount ?? null;
    const recipientName = data.recipientName || null;
    const fromCurrency = data.fromCurrency || null;
    const toCurrency = data.toCurrency || null;

    if (action === 'send_money') {
      return {
        type: 'send_money',
        data: {
          amount: amount ?? undefined,
          recipient: recipientName ?? undefined,
        },
      };
    }

    if (action === 'convert_currency') {
      return {
        type: 'convert_currency',
        data: {
          amount: amount ?? undefined,
          fromCurrency: fromCurrency ?? undefined,
          toCurrency: toCurrency ?? undefined,
        },
      };
    }

    if (action === 'check_balance') {
      return {
        type: 'check_balance',
        data: {},
      };
    }

    if (action === 'view_history') {
      return {
        type: 'view_history',
        data: {},
      };
    }

    if (action === 'offramp') {
      return {
        type: 'offramp',
        data: {
          amount: amount ?? undefined,
          bankName: data.bankName || undefined,
          accountNumber: data.accountNumber || undefined,
          accountName: data.accountName || undefined,
        },
      };
    }

    if (action === 'add_bank') {
      return {
        type: 'add_bank',
        data: {
          bankName: data.bankName || undefined,
          accountNumber: data.accountNumber || undefined,
          accountName: data.accountName || undefined,
        },
      };
    }

    if (action === 'create_stellar') {
      return {
        type: 'create_stellar',
        data: {},
      };
    }

    if (action === 'check_stellar') {
      return {
        type: 'check_stellar',
        data: {},
      };
    }

    if (action === 'send_stellar') {
      return {
        type: 'send_stellar',
        data: {
          amount: amount ?? undefined,
          stellarAddress: data.stellarAddress || undefined,
        },
      };
    }

    return { type: 'unknown' };
  } catch (error) {
    console.error('[AI Parse] Failed to parse intent:', error);
    return { type: 'unknown' };
  }
}


function shortenWallet(address: string): string {
  if (address.length > 12) {
    return `${address.slice(0, 8)}...${address.slice(-4)}`;
  }
  return address;
}

const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  NGN: 1400,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 148.5,
  XLM: 0.0035,
};

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [chatState, setChatState] = useState<ChatState>('idle');
  const [pendingTransaction, setPendingTransaction] = useState<{
    recipientName: string;
    amount: number;
    walletAddress?: string;
    saveName?: string;
  } | null>(null);
  const [showRecipientModal, setShowRecipientModal] = useState(false);
  const [modalDefaults, setModalDefaults] = useState({ name: '', wallet: '' });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recipientUsageCount, setRecipientUsageCount] = useState<Record<string, number>>({});
  const [insightTriggered, setInsightTriggered] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<{ id: number; bank_name: string; account_number: string; account_name: string; is_default: boolean }[]>([]);
  const [pendingOfframp, setPendingOfframp] = useState<{ amount?: number; bankName?: string; accountNumber?: string; accountName?: string } | null>(null);
  const { user, loading: authLoading, signOut } = useAuth();
  const { speak } = useSpeechSynthesis(voiceEnabled);
  const { sendPayment: sendPaymentToBackend, addFunds, refreshBalance } = useWallet();
  const { addNotification } = useNotificationCenter();
  const alertIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('remitx-dark-mode');
    if (savedTheme !== null) {
      setIsDarkMode(savedTheme === 'true');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('remitx-dark-mode', String(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    const savedRecipients = localStorage.getItem('remitx-recipients');
    if (savedRecipients) {
      try {
        setRecipients(JSON.parse(savedRecipients));
      } catch {
        setRecipients(DEFAULT_RECIPIENTS);
      }
    } else {
      setRecipients(DEFAULT_RECIPIENTS);
      localStorage.setItem('remitx-recipients', JSON.stringify(DEFAULT_RECIPIENTS));
    }
  }, []);

  useEffect(() => {
    const savedTransactions = localStorage.getItem('remitx-transactions');
    if (savedTransactions) {
      try {
        setTransactions(JSON.parse(savedTransactions));
      } catch {
        setTransactions([]);
      }
    }
  }, []);

  useEffect(() => {
    const loadBankAccounts = async () => {
      try {
        const res = await fetch('/backend/banks');
        const data = await res.json();
        if (data.accounts) {
          setBankAccounts(data.accounts);
        }
      } catch (error) {
        console.error('Failed to load bank accounts:', error);
      }
    };

    loadBankAccounts();
  }, []);

  useEffect(() => {
    if (transactions.length > 0) {
      localStorage.setItem('remitx-transactions', JSON.stringify(transactions));
    }
  }, [transactions]);

  useEffect(() => {
    const balance = localStorage.getItem('remitx-balance');
    if (!balance) {
      localStorage.setItem('remitx-balance', '250');
    }
  }, []);

  useEffect(() => {
    alertIntervalRef.current = setInterval(async () => {
      if (Math.random() > 0.7) {
        const sender = SAMPLE_SENDERS[Math.floor(Math.random() * SAMPLE_SENDERS.length)];
        const amount = Math.floor(Math.random() * 100) + 10;
        
        try {
          await addFunds(amount, `Received from ${sender}`);
        } catch (error) {
          console.error('Failed to add incoming funds:', error);
        }
        
        const newAlert: Alert = {
          id: generateId(),
          type: 'incoming',
          title: 'Incoming Payment',
          message: `You received $${amount} from ${sender}`,
          timestamp: new Date(),
          read: false,
        };
        
          setAlerts(prev => [...prev, newAlert]);
          
          await addNotification({
            title: 'Incoming Payment',
            message: `You received $${amount} from ${sender}`,
            type: 'incoming',
          });
        }
    }, 120000);
    
    return () => {
      if (alertIntervalRef.current) {
        clearInterval(alertIntervalRef.current);
      }
    };
  }, [addFunds, addNotification]);

  useEffect(() => {
    const synth = window.speechSynthesis;
    if (synth) {
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance('Hello, I am RemitX AI. How can I help you?');
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      setTimeout(() => synth.speak(utterance), 500);
    }
  }, []);

  const dismissAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, read: true } : alert
    ));
  }, []);

  const findRecipient = (name: string) => {
    return recipients.find(r => r.name.toLowerCase() === name.toLowerCase());
  };

  const addRecipient = useCallback(async (name: string, walletAddress: string) => {
    try {
      const response = await fetch('/api/recipients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, wallet: walletAddress }),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        const newRecipient: Recipient = {
          id: generateId(),
          name,
          walletAddress,
        };
        const updatedRecipients = [...recipients, newRecipient];
        setRecipients(updatedRecipients);
        localStorage.setItem('remitx-recipients', JSON.stringify(updatedRecipients));
        
        if (data.balance) {
          await refreshBalance();
        }
      }
    } catch (error) {
      console.error('Failed to add recipient to backend:', error);
    }
  }, [recipients, refreshBalance]);

  const toggleTheme = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled(prev => !prev);
  }, []);

  const triggerInsight = useCallback((type: 'rate' | 'frequent', message: string) => {
    const insightMessage: Message = {
      id: generateId(),
      role: 'ai',
      content: message,
      timestamp: new Date(),
      type: 'insight',
    };
    
    setMessages(prev => [...prev, insightMessage]);
    
    const insightAlert: Alert = {
      id: generateId(),
      type: 'insight',
      title: 'AI Insight',
      message: message,
      timestamp: new Date(),
      read: false,
    };
    
    setAlerts(prev => [...prev, insightAlert]);
    
    if (voiceEnabled) {
      speak(message);
    }
  }, [voiceEnabled, speak]);

  const handleConfirmPayment = useCallback(async () => {
    if (!pendingTransaction && !pendingOfframp) return;
    
    setMessages(prev => [...prev, {
      id: generateId(),
      role: 'user',
      content: 'Confirm',
      timestamp: new Date(),
    }]);
    
    setIsTyping(true);
    
    try {
      if (pendingOfframp && pendingOfframp.amount) {
        const bankAccountId = bankAccounts.find(a => a.bank_name === pendingOfframp.bankName)?.id || bankAccounts[0]?.id;
        if (!bankAccountId) {
          const response: Message = {
            id: generateId(),
            role: 'ai',
            content: 'Please add a bank account first before withdrawing.',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, response]);
          setIsTyping(false);
          setPendingTransaction(null);
          setPendingOfframp(null);
          setChatState('idle');
          return;
        }

        const ngnRate = EXCHANGE_RATES['NGN'];
        const nairaAmount = Math.round(pendingOfframp.amount * ngnRate);

        const offrampRes = await fetch('/backend/offramp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bankAccountId,
            amount: pendingOfframp.amount,
            nairaAmount,
            rate: ngnRate,
          }),
        });

        const offrampData = await offrampRes.json();

        if (offrampRes.ok && offrampData.success) {
          const response: Message = {
            id: generateId(),
            role: 'ai',
            content: `Off-ramp initiated! $${pendingOfframp.amount} → ₦${nairaAmount.toLocaleString()} will be sent to your ${pendingOfframp.bankName} account. Reference: ${offrampData.transaction?.reference}`,
            timestamp: new Date(),
            type: 'transaction',
            transactionData: {
              recipient: pendingOfframp.bankName || 'bank',
              amount: pendingOfframp.amount,
              currency: 'USD',
              status: 'success',
              type: 'sent',
            },
          };

          setMessages(prev => [...prev, response]);

          await addNotification({
            title: 'Off-ramp Initiated',
            message: `$${pendingOfframp.amount} → ₦${nairaAmount.toLocaleString()} sent to ${pendingOfframp.bankName || 'bank'}. Reference: ${offrampData.transaction?.reference}`,
            type: 'transaction',
            actionUrl: '/dashboard',
          });

          setPendingTransaction(null);
          setPendingOfframp(null);
          setChatState('idle');
          setIsTyping(false);

          if (voiceEnabled) speak(response.content);
        } else {
          const errorMessage: Message = {
            id: generateId(),
            role: 'ai',
            content: offrampData.error || 'Off-ramp failed. Please try again.',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, errorMessage]);
          setIsTyping(false);
          setPendingTransaction(null);
          setPendingOfframp(null);
          setChatState('idle');
        }
        return;
      }

      if (!pendingTransaction) return;
      const { recipientName, amount, walletAddress } = pendingTransaction;

      if (recipientName === 'Stellar' && walletAddress) {
        try {
          const res = await fetch('/api/stellar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'send',
              destination: walletAddress,
              amount: amount.toString(),
            }),
          });
          const stellarData = await res.json();

          if (res.ok && stellarData.success) {
            const response: Message = {
              id: generateId(),
              role: 'ai',
              content: `Successfully sent ${amount} XLM to ${shortenWallet(walletAddress)}!`,
              timestamp: new Date(),
              type: 'transaction',
              transactionData: {
                recipient: 'Stellar',
                amount,
                currency: 'XLM',
                status: 'success',
                type: 'sent',
              },
            };
            setMessages(prev => [...prev, response]);
          } else {
            const errorMessage: Message = {
              id: generateId(),
              role: 'ai',
              content: stellarData.error || 'Stellar transfer failed. Please try again.',
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
          }
        } catch (error) {
          const errorMessage: Message = {
            id: generateId(),
            role: 'ai',
            content: 'An error occurred while processing your Stellar transfer.',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      } else {
        const result = await sendPaymentToBackend(recipientName, amount);
        console.log('[Payment] Result:', result);

        if (result.success) {
          console.log('[Payment] Calling refreshBalance...');
          await refreshBalance();
          console.log('[Payment] refreshBalance done');
          const transactionData: TransactionData = {
            recipient: recipientName,
            amount: amount,
            currency: '$',
            status: 'success',
            type: 'sent',
          };

          const response: Message = {
            id: generateId(),
            role: 'ai',
            content: `Successfully sent $${amount} to ${recipientName}!`,
            timestamp: new Date(),
            type: 'transaction',
            transactionData,
          };

          setMessages(prev => [...prev, response]);

          await addNotification({
            title: 'Payment Sent',
            message: `Successfully sent $${amount} to ${recipientName}`,
            type: 'transaction',
          });

          const newTransaction: Transaction = {
            id: generateId(),
            name: recipientName,
            amount: amount,
            currency: '$',
            status: 'sent',
            type: 'sent',
            timestamp: new Date(),
          };

          setTransactions(prev => [newTransaction, ...prev].slice(0, 10));

          const newUsageCount = { ...recipientUsageCount };
          newUsageCount[recipientName.toLowerCase()] = (newUsageCount[recipientName.toLowerCase()] || 0) + 1;
          setRecipientUsageCount(newUsageCount);

          if (newUsageCount[recipientName.toLowerCase()] === 3 && !insightTriggered) {
            setInsightTriggered(true);
            setTimeout(() => {
              triggerInsight('frequent', `You've sent money to ${recipientName} multiple times. Would you like to automate this as a weekly transfer?`);
            }, 2000);
          }

          if (voiceEnabled) {
            speak(response.content);
          }
        } else {
          const errorMessage: Message = {
            id: generateId(),
            role: 'ai',
            content: result.message || 'Payment failed. Please try again.',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, errorMessage]);

          if (voiceEnabled) {
            speak(result.message || 'Payment failed');
          }
        }
      }
    } catch (error) {
      const errorMessage: Message = {
        id: generateId(),
        role: 'ai',
        content: 'An error occurred while processing your payment.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setPendingTransaction(null);
      setPendingOfframp(null);
      setChatState('idle');
    }
  }, [pendingTransaction, pendingOfframp, bankAccounts, voiceEnabled, speak, recipientUsageCount, insightTriggered, triggerInsight, sendPaymentToBackend, refreshBalance, addNotification]);

  const handleCancelPayment = useCallback(() => {
    if (!pendingTransaction) return;
    
    setMessages(prev => [...prev, {
      id: generateId(),
      role: 'user',
      content: 'Cancel',
      timestamp: new Date(),
    }]);
    
    setTimeout(() => {
      const response: Message = {
        id: generateId(),
        role: 'ai',
        content: 'Transaction cancelled. How can I help you?',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, response]);
      setPendingTransaction(null);
      setChatState('idle');
      
      if (voiceEnabled) {
        speak(response.content);
      }
    }, 500);
  }, [pendingTransaction, voiceEnabled, speak]);
  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    
    setTimeout(async () => {
      const lowerContent = content.toLowerCase();
      
      if (chatState === 'awaiting_wallet' && pendingTransaction) {
        const walletMatch = content.match(/^[A-Z0-9]{10,}$/i);
        if (walletMatch || content.length > 8) {
          const walletAddress = content.trim().toUpperCase();
          
          const updatedPending = { ...pendingTransaction, walletAddress };
          setPendingTransaction(updatedPending);
          
          const response: Message = {
            id: generateId(),
            role: 'ai',
            content: `Do you want to save this as ${updatedPending.recipientName}?`,
            timestamp: new Date(),
          };
          
          setMessages(prev => [...prev, response]);
          setChatState('awaiting_save_confirmation');
          setIsTyping(false);
          
          if (voiceEnabled) {
            speak(response.content);
          }
          return;
        } else if (lowerContent === 'yes' || lowerContent === 'skip') {
          setShowRecipientModal(true);
          setModalDefaults({
            name: pendingTransaction.recipientName,
            wallet: ''
          });
          setIsTyping(false);
          return;
        } else {
          const response: Message = {
            id: generateId(),
            role: 'ai',
            content: "Please provide a valid wallet address.",
            timestamp: new Date(),
          };
          
          setMessages(prev => [...prev, response]);
          setIsTyping(false);
          return;
        }
      }
      
      if (chatState === 'awaiting_save_confirmation' && pendingTransaction) {
        if (lowerContent === 'yes' || lowerContent === 'y') {
          addRecipient(pendingTransaction.recipientName, pendingTransaction.walletAddress!);
          
          const confirmMessage: Message = {
            id: generateId(),
            role: 'ai',
            content: `${pendingTransaction.recipientName} has been saved. Ready to send $${pendingTransaction.amount} to ${pendingTransaction.recipientName} (${shortenWallet(pendingTransaction.walletAddress!)})?`,
            timestamp: new Date(),
            type: 'confirmation',
            confirmationData: {
              recipientName: pendingTransaction.recipientName,
              walletAddress: pendingTransaction.walletAddress!,
              amount: pendingTransaction.amount,
              currency: '$',
            },
          };
          
          setMessages(prev => [...prev, confirmMessage]);
          setChatState('confirming_payment');
          setIsTyping(false);
          
          if (voiceEnabled) {
            speak(confirmMessage.content);
          }
          return;
        } else if (lowerContent === 'no' || lowerContent === 'n') {
          const transactionData: TransactionData = {
            recipient: pendingTransaction.recipientName,
            amount: pendingTransaction.amount,
            currency: '$',
            status: 'success',
            type: 'sent',
          };
          
          const response: Message = {
            id: generateId(),
            role: 'ai',
            content: `Sending $${pendingTransaction.amount} to ${pendingTransaction.recipientName}...`,
            timestamp: new Date(),
            type: 'transaction',
            transactionData,
          };
          
          setMessages(prev => [...prev, response]);
          setPendingTransaction(null);
          setChatState('idle');
          setIsTyping(false);
          
          if (voiceEnabled) {
            speak(response.content);
          }
          return;
        } else {
          const response: Message = {
            id: generateId(),
            role: 'ai',
            content: 'Please answer yes or no.',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, response]);
          setIsTyping(false);
          return;
        }
      }
      
      if (chatState === 'confirming_payment') {
        if (lowerContent === 'yes' || lowerContent === 'confirm') {
          handleConfirmPayment();
          return;
        } else if (lowerContent === 'no' || lowerContent === 'cancel') {
          handleCancelPayment();
          return;
        }
      }
      
      const intent = await parseIntent(content);
      
      if (intent.type === 'check_balance') {
        const balance = await fetch('/api/wallet').then(res => res.json()).catch(() => ({ balance: 'unavailable' }));
        const response: Message = {
          id: generateId(),
          role: 'ai',
          content: `Your current balance is $${balance.balance ?? 'unavailable'}.`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, response]);
        setIsTyping(false);
        if (voiceEnabled) {
          speak(response.content);
        }
        return;
      }

      if (intent.type === 'view_history') {
        const res = await fetch('/api/transactions');
        const data = await res.json();
        const transactions = data.transactions || [];
        if (transactions.length === 0) {
          const response: Message = {
            id: generateId(),
            role: 'ai',
            content: 'You have no transactions yet.',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, response]);
        } else {
          const lines = transactions.slice(0, 5).map((t: any) => `${t.type === 'send' ? 'Sent' : 'Received'} $${t.amount} to ${t.recipient}`).join('\n');
          const response: Message = {
            id: generateId(),
            role: 'ai',
            content: `Recent transactions:\n${lines}`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, response]);
        }
        setIsTyping(false);
        if (voiceEnabled) {
          speak('Here are your recent transactions');
        }
        return;
      }

      if (intent.type === 'add_bank' && intent.data) {
        const { bankName, accountNumber, accountName } = intent.data;
        setModalDefaults({ name: accountName || '', wallet: accountNumber || '' });
        setShowRecipientModal(true);
        setIsTyping(false);
        return;
      }

      if (intent.type === 'offramp' && intent.data) {
        const { amount, bankName, accountNumber, accountName } = intent.data;

        if (!amount || amount <= 0) {
          const response: Message = {
            id: generateId(),
            role: 'ai',
            content: 'How much would you like to withdraw to your Nigerian bank account?',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, response]);
          setIsTyping(false);
          if (voiceEnabled) speak(response.content);
          return;
        }

        let targetBank = bankName || accountName;
        let targetAccount = accountNumber;

        if (!targetBank && bankAccounts.length > 0) {
          const defaultAccount = bankAccounts.find(a => a.is_default) || bankAccounts[0];
          targetBank = defaultAccount.bank_name;
          targetAccount = defaultAccount.account_number;
        }

        if (!targetBank) {
          const response: Message = {
            id: generateId(),
            role: 'ai',
            content: 'Please provide the bank name and account number for your Nigerian bank account. For example, "withdraw 100 to GTBank 1234567890"',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, response]);
          setPendingOfframp({ amount, bankName, accountNumber, accountName });
          setIsTyping(false);
          if (voiceEnabled) speak(response.content);
          return;
        }

        const ngnRate = EXCHANGE_RATES['NGN'];
        const nairaAmount = Math.round(amount * ngnRate);

        setPendingOfframp({
          amount,
          bankName: targetBank,
          accountNumber: targetAccount,
          accountName: accountName,
        });

        const response: Message = {
          id: generateId(),
          role: 'ai',
          content: `Confirm off-ramp: $${amount} → ₦${nairaAmount.toLocaleString()} at rate ₦${ngnRate}/$ to ${targetBank}${targetAccount ? ` (${shortenWallet(targetAccount)})` : ''}?`,
          timestamp: new Date(),
          type: 'confirmation',
          confirmationData: {
            recipientName: targetBank,
            walletAddress: targetAccount || '',
            amount,
            currency: 'USD',
          },
        };

        setPendingTransaction({
          recipientName: targetBank,
          amount,
          walletAddress: targetAccount,
        });
        setChatState('confirming_payment');
        setMessages(prev => [...prev, response]);
        setIsTyping(false);
        if (voiceEnabled) speak(response.content);
        return;
      }
      
      if (intent.type === 'send_stellar' && intent.data) {
        const { amount, stellarAddress } = intent.data;

        if (!stellarAddress) {
          const response: Message = {
            id: generateId(),
            role: 'ai',
            content: 'Please provide a valid Stellar address (starts with G).',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, response]);
          setIsTyping(false);
          if (voiceEnabled) speak(response.content);
          return;
        }

        const response: Message = {
          id: generateId(),
          role: 'ai',
          content: `Confirm sending ${amount} XLM to ${shortenWallet(stellarAddress)}?`,
          timestamp: new Date(),
          type: 'confirmation',
          confirmationData: {
            recipientName: 'Stellar',
            walletAddress: stellarAddress,
            amount: amount!,
            currency: 'XLM',
          },
        };

        setPendingTransaction({
          recipientName: 'Stellar',
          amount: amount!,
          walletAddress: stellarAddress,
        });
        setChatState('confirming_payment');
        setMessages(prev => [...prev, response]);
        setIsTyping(false);
        if (voiceEnabled) speak(response.content);
        return;
      }

      if (intent.type === 'create_stellar') {
        try {
          const res = await fetch('/api/stellar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create' }),
          });
          const data = await res.json();
          const response: Message = {
            id: generateId(),
            role: 'ai',
            content: `Your Stellar wallet has been created!\n\nPublic Key: ${data.publicKey}\nSecret Key: ${data.secret}\n\nSave your secret key in a safe place.`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, response]);
          setIsTyping(false);
          if (voiceEnabled) speak('Your Stellar wallet has been created.');
        } catch (error) {
          const response: Message = {
            id: generateId(),
            role: 'ai',
            content: 'Failed to create Stellar wallet. Please try again.',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, response]);
          setIsTyping(false);
        }
        return;
      }

      if (intent.type === 'check_stellar') {
        try {
          const res = await fetch('/api/stellar?account=check');
          const data = await res.json();
          const response: Message = {
            id: generateId(),
            role: 'ai',
            content: data.error
              ? data.error
              : `Stellar balances: ${data.balances?.join(', ') || '0 XLM'}`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, response]);
          setIsTyping(false);
          if (voiceEnabled) speak(response.content);
        } catch (error) {
          const response: Message = {
            id: generateId(),
            role: 'ai',
            content: 'Failed to check Stellar balance. Please try again.',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, response]);
          setIsTyping(false);
        }
        return;
      }

      if (intent.type === 'send_money' && intent.data) {
        const { amount, recipient } = intent.data;
        const foundRecipient = findRecipient(recipient!);
        
        if (foundRecipient) {
          const response: Message = {
            id: generateId(),
            role: 'ai',
            content: `Send $${amount} to ${foundRecipient.name} (${shortenWallet(foundRecipient.walletAddress)})?`,
            timestamp: new Date(),
            type: 'confirmation',
            confirmationData: {
              recipientName: foundRecipient.name,
              walletAddress: foundRecipient.walletAddress,
              amount: amount!,
              currency: '$',
            },
          };
          
          setPendingTransaction({
            recipientName: foundRecipient.name,
            amount: amount!,
            walletAddress: foundRecipient.walletAddress,
          });
          setChatState('confirming_payment');
          setMessages(prev => [...prev, response]);
          setIsTyping(false);
          
          if (voiceEnabled) {
            speak(response.content);
          }
          return;
        } else {
          setPendingTransaction({
            recipientName: recipient!,
            amount: amount!,
          });
          setChatState('awaiting_wallet');
          
          const response: Message = {
            id: generateId(),
            role: 'ai',
            content: `I don't have ${recipient} saved. Please provide a wallet address.`,
            timestamp: new Date(),
          };
          
          setMessages(prev => [...prev, response]);
          setIsTyping(false);
          
          if (voiceEnabled) {
            speak(response.content);
          }
          return;
        }
      }
      
      if (intent.type === 'convert_currency' && intent.data) {
        const { amount, fromCurrency, toCurrency } = intent.data;
        
        const from = fromCurrency?.toUpperCase() || 'USD';
        const to = toCurrency?.toUpperCase() || 'NGN';
        
        const validCurrencies = ['USD', 'NGN', 'EUR', 'GBP', 'JPY', 'XLM'];
        
        if (!validCurrencies.includes(from) || !validCurrencies.includes(to)) {
          const invalidCurrencies = [from, to].filter(c => !validCurrencies.includes(c));
          const response: Message = {
            id: generateId(),
            role: 'ai',
            content: `I can't convert ${invalidCurrencies.join(', ')}. Supported currencies are: USD, NGN (Naira), EUR, GBP, JPY, XLM. Try 'Convert $100 to Naira'`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, response]);
          setIsTyping(false);
          if (voiceEnabled) {
            speak(response.content);
          }
          return;
        }
        
        const fromRate = EXCHANGE_RATES[from] || 1;
        const toRate = EXCHANGE_RATES[to] || 1;
        const rate = toRate / fromRate;
        
        const toAmount = (amount || 100) * rate;
        
        const conversionData: ConversionData = {
          fromAmount: amount || 100,
          fromCurrency: fromCurrency?.toUpperCase() || 'USD',
          toAmount: Math.round(toAmount * 100) / 100,
          toCurrency: toCurrency?.toUpperCase() || toCurrency?.toUpperCase() || 'NGN',
          rate,
        };
        
        const response: Message = {
          id: generateId(),
          role: 'ai',
          content: `Converting ${conversionData.fromAmount} ${conversionData.fromCurrency} to ${conversionData.toCurrency} at rate ${rate}...`,
          timestamp: new Date(),
          type: 'conversion',
          conversionData,
        };
        
        setMessages(prev => [...prev, response]);
        setIsTyping(false);
        
        if (voiceEnabled) {
          speak(response.content);
        }
        return;
      }
      
      if (lowerContent === 'send money' || lowerContent.startsWith('send ')) {
        const response: Message = {
          id: generateId(),
          role: 'ai',
          content: "Sure! I can help you send money. Please tell me the recipient's name and the amount you'd like to send. For example, 'Send $50 to John'",
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, response]);
        setIsTyping(false);
        
        if (voiceEnabled) {
          speak(response.content);
        }
        return;
      }
      
      if (lowerContent === 'convert currency' || lowerContent.startsWith('convert ')) {
        const response: Message = {
          id: generateId(),
          role: 'ai',
          content: "Sure! I can help you convert currency. Please tell me how much you want to convert and the currencies involved. For example, 'Convert $100 from USD to Naira' or just '100 USD to Naira'",
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, response]);
        setIsTyping(false);
        
        if (voiceEnabled) {
          speak(response.content);
        }
        return;
      }
      
      try {
        const walletRes = await fetch('/api/wallet');
        const walletData = await walletRes.json();
        const balance = walletData.balance ?? 0;
        const recentTransactions = walletData.transactions?.slice(0, 3) || [];
        
        const aiRes = await fetch('/backend/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content,
            context: {
              balance,
              recipients,
              recentTransactions,
            },
          }),
        });
        
        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const response: Message = {
            id: generateId(),
            role: 'ai',
            content: aiData.reply || "I'm here to help with cross-border payments. Would you like to send money, convert currency, check your balance, or view transactions?",
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, response]);
          setIsTyping(false);
          if (voiceEnabled) {
            speak(response.content);
          }
          return;
        }
      } catch (error) {
        console.error('[AI Chat] Error:', error);
      }
      
      const fallbackResponses = [
        "I can help you send money or convert currencies. Try saying 'Send $50 to John' or 'Convert $100 to Naira'",
        "I understand you want to make a transaction. For sending money, say 'Send $50 to John'. For conversion, say 'Convert $100 to Euro'",
        "I'm here to help with cross-border payments. Would you like to send money or convert currency?",
      ];
      
      const response: Message = {
        id: generateId(),
        role: 'ai',
        content: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, response]);
      setIsTyping(false);
      
      if (voiceEnabled) {
        speak(response.content);
      }
    }, 800);
  }, [chatState, pendingTransaction, voiceEnabled, speak, addRecipient, handleConfirmPayment, handleCancelPayment, recipients, transactions]);

  const handleQuickAction = useCallback(async (command: string) => {
    await handleSendMessage(command);
  }, [handleSendMessage]);

  const handleOpenRecipientModal = () => {
    setModalDefaults({ name: '', wallet: '' });
    setShowRecipientModal(true);
  };

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
          onToggleTheme={toggleTheme}
          isVoiceEnabled={voiceEnabled}
          onToggleVoice={toggleVoice}
        />

        <main className="relative z-10 pt-36 pb-6 px-3 sm:px-4 max-w-2xl mx-auto min-h-screen flex flex-col sm:pt-24">
          {!user && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-2xl border backdrop-blur-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(155, 126, 233, 0.15), rgba(99, 102, 241, 0.15))',
                borderColor: 'rgba(155, 126, 233, 0.3)',
              }}
            >
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h3 className={cn('font-semibold text-white mb-1', isDarkMode ? 'text-white' : 'text-slate-900')}>
                    Sign in to access your wallet
                  </h3>
                  <p className={cn('text-sm', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                    Create an account or sign in to send money, convert currency, and more.
                  </p>
                </div>
                <Link href="/auth" className="flex-shrink-0">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 rounded-xl font-medium text-white gradient-bg whitespace-nowrap"
                  >
                    Sign In / Sign Up
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          )}

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
              onConfirmPayment={handleConfirmPayment}
              onCancelPayment={handleCancelPayment}
            />

            <div className="p-4 border-t border-inherit">
              <QuickActionButtons
                onAction={handleQuickAction}
                isDarkMode={isDarkMode}
                onOpenRecipientModal={handleOpenRecipientModal}
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

      <Toast alerts={alerts} onDismiss={dismissAlert} isDarkMode={isDarkMode} />

      <RecipientModal
        isOpen={showRecipientModal}
        onClose={() => setShowRecipientModal(false)}
        onSave={addRecipient}
        isDarkMode={isDarkMode}
        defaultName={modalDefaults.name}
        defaultWallet={modalDefaults.wallet}
      />
    </div>
  );
}