import { NextRequest, NextResponse } from 'next/server';
import { getBalance, add } from '@/lib/supabase-db';
import { getAccountOperations, checkAccountExists, server as stellarServer } from '@/lib/stellar';

console.log('[WALLET API] Using Supabase + Stellar data layer');

const STELLAR_WALLET_ADDRESS = process.env.STELLAR_WALLET_ADDRESS || 'GBC4URMCFRFIDUXH2C4OQ2Z2SPAJGWBVPAVDCXSZF4FNA7WQRLALVGGJ';

export async function GET() {
  try {
    const [supabaseBalance, stellarBalances, stellarOps] = await Promise.all([
      getBalance(),
      fetchStellarBalances(),
      getAccountOperations(STELLAR_WALLET_ADDRESS, 20),
    ]);

    const xlmBalance = stellarBalances.find(b => b.asset_code === 'XLM')?.balance ?? null;
    const usdcBalance = stellarBalances.find(b => b.asset_code === 'USDC')?.balance ?? null;

    const realTransactions = stellarOps.map((op: any) => ({
      id: op.id,
      type: op.direction === 'debit' ? 'debit' : 'credit',
      amount: op.amount,
      currency: op.asset_code,
      description: op.direction === 'debit'
        ? `Sent ${formatAmount(op.amount)} ${op.asset_code} to ${shortenAddress(op.to || '')}`
        : `Received ${formatAmount(op.amount)} ${op.asset_code} from ${shortenAddress(op.from || '')}`,
      timestamp: new Date(op.created_at),
    }));

    return NextResponse.json({
      balance: supabaseBalance,
      xlmBalance,
      usdcBalance,
      transactions: realTransactions,
    });
  } catch (error) {
    console.error('Failed to fetch wallet data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallet data' },
      { status: 500 }
    );
  }
}

function formatAmount(amount: number): string {
  if (amount === 0 || amount === undefined || amount === null) return '0';
  return Number(amount).toLocaleString(undefined, { maximumFractionDigits: 7 });
}

function shortenAddress(address: string): string {
  if (!address || address.length < 8) return address || '...';
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

async function fetchStellarBalances(): Promise<{ asset_code: string; balance: string }[]> {
  try {
    const exists = await checkAccountExists(STELLAR_WALLET_ADDRESS);
    if (!exists) return [];

    const account = await stellarServer.accounts().accountId(STELLAR_WALLET_ADDRESS).call();
    return account.balances.map((b: any) => ({
      asset_code: b.asset_type === 'native' ? 'XLM' : (b.asset_code || 'UNKNOWN'),
      balance: b.balance,
    }));
  } catch (error) {
    console.error('Failed to fetch Stellar balances:', error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, description } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    const currentBalance = await getBalance();
    const newBalance = currentBalance + amount;

    await add(newBalance - currentBalance, description || 'Deposit');

    return NextResponse.json({
      success: true,
      message: `Added $${amount} to wallet`,
      balance: newBalance,
    });
  } catch (error) {
    console.error('Failed to add funds:', error);
    return NextResponse.json(
      { error: 'Failed to add funds' },
      { status: 500 }
    );
  }
}
