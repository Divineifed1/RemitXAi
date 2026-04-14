import { NextRequest, NextResponse } from 'next/server';
import { sendPayment } from '@/lib/backend/payments';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, amount } = body;

    if (!name || amount === undefined) {
      return NextResponse.json(
        { error: 'Name and amount are required' },
        { status: 400 }
      );
    }

    const result = sendPayment(name, amount);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to send payment' },
      { status: 500 }
    );
  }
}