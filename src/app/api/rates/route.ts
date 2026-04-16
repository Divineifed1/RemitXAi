import { NextResponse } from 'next/server';
import { getExchangeRates } from '@/lib/backend/exchangeRates';

export async function GET() {
  try {
    const rates = await getExchangeRates();
    console.log('Rates returned by API:', rates);
    return NextResponse.json({ rates });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch exchange rates' },
      { status: 500 }
    );
  }
}