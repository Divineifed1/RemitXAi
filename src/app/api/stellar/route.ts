import { NextRequest, NextResponse } from 'next/server';
import {
  createAccount,
  fundAccount,
  getAccountBalance,
  getUsdcBalance,
  getAccountDetails,
  getTransactionHistory,
  checkAccountExists,
  isValidStellarAddress,
  sendPayment,
  sendUsdc,
  USDC_ASSET,
  NATIVE_ASSET,
} from '@/lib/stellar';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('account');
    const asset = searchParams.get('asset') || 'all';

    if (accountId) {
      const exists = await checkAccountExists(accountId);
      if (!exists) {
        return NextResponse.json(
          { error: 'Account not found' },
          { status: 404 }
        );
      }

      const [balances, details, transactions, usdcBalance] = await Promise.all([
        getAccountBalance(accountId),
        getAccountDetails(accountId),
        getTransactionHistory(accountId, 10),
        getUsdcBalance(accountId),
      ]);

      return NextResponse.json({
        account: accountId,
        balances,
        usdcBalance,
        details,
        transactions,
      });
    }

    return NextResponse.json({ error: 'Account ID required' }, { status: 400 });
  } catch (error) {
    console.error('Stellar account error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Stellar account' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, accountId, amount, destination, sourceSecret, asset } = body;

    switch (action) {
      case 'create': {
        const keypair = await createAccount();
        return NextResponse.json({
          success: true,
          publicKey: keypair.publicKey(),
          secret: keypair.secret(),
        });
      }

      case 'fund': {
        if (!accountId) {
          return NextResponse.json(
            { error: 'Account ID is required' },
            { status: 400 }
          );
        }
        await fundAccount(accountId);
        return NextResponse.json({
          success: true,
          message: `Account ${accountId} funded via friendbot`,
        });
      }

      case 'balance': {
        if (!accountId) {
          return NextResponse.json(
            { error: 'Account ID is required' },
            { status: 400 }
          );
        }
        const balances = await getAccountBalance(accountId);
        const usdcBalance = await getUsdcBalance(accountId);
        return NextResponse.json({ balances, usdcBalance });
      }

      case 'send': {
        if (!sourceSecret || !destination || !amount) {
          return NextResponse.json(
            { error: 'Source secret, destination, and amount are required' },
            { status: 400 }
          );
        }
        if (!isValidStellarAddress(destination)) {
          return NextResponse.json(
            { error: 'Invalid Stellar destination address' },
            { status: 400 }
          );
        }

        const targetAsset = asset === 'USDC' ? USDC_ASSET : NATIVE_ASSET;
        const currencyLabel = asset === 'USDC' ? 'USDC' : 'XLM';

        const result = await sendPayment(sourceSecret, destination, String(amount), targetAsset);
        return NextResponse.json({
          success: true,
          result,
          message: `Sent ${amount} ${currencyLabel} to ${destination}`,
        });
      }

      case 'send_usdc': {
        if (!sourceSecret || !destination || !amount) {
          return NextResponse.json(
            { error: 'Source secret, destination, and amount are required' },
            { status: 400 }
          );
        }
        if (!isValidStellarAddress(destination)) {
          return NextResponse.json(
            { error: 'Invalid Stellar destination address' },
            { status: 400 }
          );
        }
        const result = await sendUsdc(sourceSecret, destination, String(amount));
        return NextResponse.json({
          success: true,
          result,
          message: `Sent ${amount} USDC to ${destination}`,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Stellar operation error:', error);
    return NextResponse.json(
      { error: 'Failed to process Stellar operation' },
      { status: 500 }
    );
  }
}