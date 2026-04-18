'use client';

import { Redis } from '@upstash/redis';

let redis: Redis | null = null;
let useRedis = false;
let inMemoryWallet = { balance: 500 };
let inMemoryTransactions: { id: number; recipient: string; amount: number; type: 'send' | 'receive'; created_at: string }[] = [];

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    useRedis = true;
    console.log('Using Upstash Redis for data storage');
  }
} catch (error) {
  console.log('Redis not available, using in-memory demo mode');
  useRedis = false;
}

const WALLET_KEY = 'remitx:wallet';
const TRANSACTIONS_KEY = 'remitx:transactions';

export async function getBalance(): Promise<number> {
  if (useRedis && redis) {
    const balance = await redis.get<number>(WALLET_KEY);
    return balance ?? 500;
  }
  return inMemoryWallet.balance;
}

export async function setBalance(amount: number): Promise<void> {
  if (useRedis && redis) {
    await redis.set(WALLET_KEY, amount);
  } else {
    inMemoryWallet.balance = amount;
  }
}

export async function addTransaction(recipient: string, amount: number, type: 'send' | 'receive'): Promise<void> {
  const transaction = {
    id: Date.now(),
    recipient,
    amount,
    type,
    created_at: new Date().toISOString(),
  };

  if (useRedis && redis) {
    await redis.lpush(TRANSACTIONS_KEY, JSON.stringify(transaction));
    await redis.ltrim(TRANSACTIONS_KEY, 0, 99);
  } else {
    inMemoryTransactions.push(transaction);
  }
}

export async function getTransactions(limit = 20): Promise<{ id: number; recipient: string; amount: number; type: 'send' | 'receive'; created_at: string }[]> {
  if (useRedis && redis) {
    const transactions = await redis.lrange(TRANSACTIONS_KEY, 0, limit - 1);
    return transactions.map((t: string) => JSON.parse(t));
  }
  return [...inMemoryTransactions].reverse().slice(0, limit);
}

export async function initializeWallet(): Promise<void> {
  if (useRedis && redis) {
    const existing = await redis.get<number>(WALLET_KEY);
    if (existing === null) {
      await redis.set(WALLET_KEY, 500);
    }
  }
}

export { redis, useRedis, inMemoryWallet, inMemoryTransactions };
