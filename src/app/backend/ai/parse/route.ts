import { NextRequest, NextResponse } from 'next/server';
import { parseMessage } from '@/lib/backend/ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const parsed = parseMessage(message);

    return NextResponse.json(parsed);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to parse message' },
      { status: 500 }
    );
  }
}