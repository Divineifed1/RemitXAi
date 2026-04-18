import { Redis } from '@upstash/redis';
import IoRedis from 'ioredis';

console.log('[Redis] ENV CHECK:', {
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ? 'SET' : 'UNDEFINED',
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN ? 'SET' : 'UNDEFINED',
  remitXAi_REDIS_URL: process.env.remitXAi_REDIS_URL ? 'SET' : 'UNDEFINED',
});

let redis: Redis | null = null;
let ioredisClient: InstanceType<typeof IoRedis> | null = null;
let useRedis = false;
let useIoRedis = false;
let inMemoryWallet = { balance: 500 };
let inMemoryTransactions: { id: number; recipient: string; amount: number; type: 'send' | 'receive'; created_at: string }[] = [];

// Upstash KV format (recommended for Vercel)
const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

// Legacy/other Redis format
const legacyUrl = process.env.remitXAi_REDIS_URL || process.env.REDIS_URL;

try {
  if (upstashUrl && upstashToken) {
    // Upstash KV format
    redis = new Redis({
      url: upstashUrl,
      token: upstashToken,
    });
    useRedis = true;
    console.log('Using Upstash Redis for data storage');
  } else if (legacyUrl) {
    // Use ioredis for standard Redis connections
    const match = legacyUrl.match(/redis:\/\/[^:]+:([^@]+)@(.+)/);
    if (match) {
      const [, token, host] = match;
      ioredisClient = new IoRedis(legacyUrl);
      useIoRedis = true;
      console.log('Using ioredis for Redis storage');
    }
  } else {
    console.log('No Redis credentials found, using in-memory demo mode');
  }
} catch (error) {
  console.log('Redis not available, using in-memory demo mode');
  useRedis = false;
  useIoRedis = false;
}

const WALLET_KEY = 'remitx:wallet';
const TRANSACTIONS_KEY = 'remitx:transactions';

export async function getBalance(): Promise<number> {
  console.log('[Redis getBalance] useRedis:', useRedis, 'useIoRedis:', useIoRedis);
  try {
    if (useRedis && redis) {
      const balance = await redis.get<number>(WALLET_KEY);
      console.log('[Redis getBalance] Upstash result:', balance);
      return balance ?? 500;
    }
    if (useIoRedis && ioredisClient) {
      const balance = await ioredisClient.get(WALLET_KEY);
      console.log('[Redis getBalance] IoRedis result:', balance);
      return balance ? parseFloat(balance) : 500;
    }
  } catch (error) {
    console.error('[Redis getBalance] Error:', error);
  }
  console.log('[Redis getBalance] Falling back to in-memory:', inMemoryWallet.balance);
  return inMemoryWallet.balance;
}

export async function setBalance(amount: number): Promise<void> {
  console.log('[Redis setBalance] Setting balance to:', amount, 'useRedis:', useRedis, 'useIoRedis:', useIoRedis);
  try {
    if (useRedis && redis) {
      await redis.set(WALLET_KEY, amount);
      console.log('[Redis setBalance] Upstash success');
      return;
    }
    if (useIoRedis && ioredisClient) {
      await ioredisClient.set(WALLET_KEY, amount.toString());
      console.log('[Redis setBalance] IoRedis success');
      return;
    }
  } catch (error) {
    console.error('[Redis setBalance] Error:', error);
  }
  console.log('[Redis setBalance] Falling back to in-memory');
  inMemoryWallet.balance = amount;
}

export async function addTransaction(recipient: string, amount: number, type: 'send' | 'receive'): Promise<void> {
  const transaction = {
    id: Date.now(),
    recipient,
    amount,
    type,
    created_at: new Date().toISOString(),
  };
  
  console.log('[Redis addTransaction] Adding:', transaction);

  try {
    if (useRedis && redis) {
      await redis.lpush(TRANSACTIONS_KEY, JSON.stringify(transaction));
      await redis.ltrim(TRANSACTIONS_KEY, 0, 99);
      return;
    }
    if (useIoRedis && ioredisClient) {
      await ioredisClient.lpush(TRANSACTIONS_KEY, JSON.stringify(transaction));
      await ioredisClient.ltrim(TRANSACTIONS_KEY, 0, 99);
      return;
    }
  } catch (error) {
    console.error('Redis addTransaction error:', error);
  }
  inMemoryTransactions.push(transaction);
}

export async function getTransactions(limit = 20): Promise<{ id: number; recipient: string; amount: number; type: 'send' | 'receive'; created_at: string }[]> {
  console.log('[Redis getTransactions] useRedis:', useRedis, 'useIoRedis:', useIoRedis);
  try {
    if (useRedis && redis) {
      const transactions = await redis.lrange(TRANSACTIONS_KEY, 0, limit - 1);
      console.log('[Redis getTransactions] Upstash result:', transactions);
      return transactions.map((t: string) => JSON.parse(t));
    }
    if (useIoRedis && ioredisClient) {
      const transactions = await ioredisClient.lrange(TRANSACTIONS_KEY, 0, limit - 1);
      console.log('[Redis getTransactions] IoRedis result:', transactions);
      return transactions.map((t: string) => JSON.parse(t));
    }
  } catch (error) {
    console.error('[Redis getTransactions] Error:', error);
  }
  return [...inMemoryTransactions].reverse().slice(0, limit);
}

export async function initializeWallet(): Promise<void> {
  try {
    if (useRedis && redis) {
      const existing = await redis.get<number>(WALLET_KEY);
      if (existing === null) {
        await redis.set(WALLET_KEY, 500);
      }
    }
    if (useIoRedis && ioredisClient) {
      const existing = await ioredisClient.get(WALLET_KEY);
      if (!existing) {
        await ioredisClient.set(WALLET_KEY, '500');
      }
    }
  } catch (error) {
    console.error('Redis initializeWallet error:', error);
  }
}

export { redis, ioredisClient, useRedis, useIoRedis, inMemoryWallet, inMemoryTransactions };