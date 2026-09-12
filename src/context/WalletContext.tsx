'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  currency: string;
  description: string;
  timestamp: Date;
}

interface WalletContextType {
  balance: number;
  xlmBalance: string | null;
  usdcBalance: string | null;
  transactions: WalletTransaction[];
  isLoading: boolean;
  refreshBalance: () => Promise<void>;
  addFunds: (amount: number, description?: string) => Promise<{ success: boolean; balance?: number; message?: string }>;
  sendPayment: (name: string, amount: number) => Promise<{ success: boolean; message: string }>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState<number>(0);
  const [xlmBalance, setXlmBalance] = useState<string | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchWallet = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) {
        setIsLoading(true);
      }
      const response = await fetch('/api/wallet');
      const data = await response.json();
      console.log('[WalletContext] fetchWallet result:', data.balance, data.xlmBalance, data.usdcBalance);
      setBalance(data.balance);
      setXlmBalance(data.xlmBalance ?? null);
      setUsdcBalance(data.usdcBalance ?? null);
      if (data.transactions) {
        setTransactions(data.transactions.map((t: any) => ({
          id: String(t.id || t.recipient || t.hash),
          type: t.type === 'receive' || t.type === 'credit' ? 'credit' : 'debit',
          amount: t.amount,
          currency: t.currency || 'XLM',
          description: t.description || t.recipient || '',
          timestamp: new Date(t.timestamp || t.created_at || Date.now()),
        })));
      }
      setHasLoaded(true);
      console.log('[WalletContext] fetchWallet complete');
    } catch (error) {
      console.error('Failed to fetch wallet:', error);
      setHasLoaded(true); // Still mark as loaded to stop loading state
    } finally {
      if (isInitial) {
        setIsLoading(false);
      }
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    await fetchWallet();
  }, [fetchWallet]);

  const addFunds = useCallback(async (amount: number, description?: string) => {
    try {
      const response = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, description }),
      });
      const data = await response.json();
      if (data.success) {
        setBalance(data.balance);
        await fetchWallet();
      }
      return data;
    } catch (error) {
      console.error('Failed to add funds:', error);
      return { success: false, message: 'Failed to add funds' };
    }
  }, [fetchWallet]);

  const sendPayment = useCallback(async (name: string, amount: number) => {
    try {
      const response = await fetch('/api/payments/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, amount }),
      });
      const data = await response.json();
      if (data.success) {
        await fetchWallet();
      }
      return data;
    } catch (error) {
      console.error('Failed to send payment:', error);
      return { success: false, message: 'Failed to send payment' };
    }
  }, [fetchWallet]);

  useEffect(() => {
    if (!hasLoaded) {
      console.log('[WalletContext] Initial fetch');
      fetchWallet(true);
    }
  }, [hasLoaded, fetchWallet]);

  return (
    <WalletContext.Provider
      value={{
        balance,
        xlmBalance,
        usdcBalance,
        transactions,
        isLoading,
        refreshBalance,
        addFunds,
        sendPayment,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}