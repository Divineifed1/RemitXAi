'use client';

import { useState, useCallback, useEffect } from 'react';

interface WalletData {
  balance: number;
  transactions?: {
    id: string;
    type: 'credit' | 'debit';
    amount: number;
    description: string;
    timestamp: Date;
  }[];
}

export function useWallet() {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletData['transactions']>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWallet = useCallback(async () => {
    try {
      const response = await fetch('/api/wallet');
      const data: WalletData = await response.json();
      setBalance(data.balance);
      if (data.transactions) {
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Failed to fetch wallet:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
      throw error;
    }
  }, [fetchWallet]);

  const refreshBalance = useCallback(async () => {
    await fetchWallet();
  }, [fetchWallet]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  return {
    balance,
    transactions,
    isLoading,
    refreshBalance,
    addFunds,
  };
}