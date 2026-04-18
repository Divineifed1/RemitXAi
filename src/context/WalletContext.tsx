'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  timestamp: Date;
}

interface WalletContextType {
  balance: number;
  transactions: WalletTransaction[];
  isLoading: boolean;
  refreshBalance: () => Promise<void>;
  addFunds: (amount: number, description?: string) => Promise<{ success: boolean; balance?: number; message?: string }>;
  sendPayment: (name: string, amount: number) => Promise<{ success: boolean; message: string }>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWallet = useCallback(async () => {
    try {
      const response = await fetch('/api/wallet');
      const data = await response.json();
      console.log('[WalletContext] fetchWallet result:', data.balance);
      setBalance(data.balance);
      if (data.transactions) {
        setTransactions(data.transactions.map((t: WalletTransaction) => ({
          ...t,
          timestamp: new Date(t.timestamp),
        })));
      }
    } catch (error) {
      console.error('Failed to fetch wallet:', error);
    } finally {
      setIsLoading(false);
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
    fetchWallet();
  }, [fetchWallet]);

  return (
    <WalletContext.Provider
      value={{
        balance,
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