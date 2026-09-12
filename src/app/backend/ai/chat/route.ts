import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new OpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': 'https://remitx-ai.com',
      'X-Title': 'RemitX AI',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, context } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const openai = getOpenAIClient();
    if (!openai) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }

    const systemPrompt = `You are RemitX AI, an intelligent general-purpose assistant. You can answer questions on any topic, including general knowledge, science, history, technology, advice, and more. You also have access to the user's financial context and can help with payments, currency conversion, balance checks, and transaction history when asked.

Current context:
- Wallet balance: $${context?.balance ?? 'unknown'}
- Saved recipients: ${context?.recipients?.length ? context.recipients.map((r: any) => r.name).join(', ') : 'none'}
- Recent transactions: ${context?.recentTransactions?.length ? context.recentTransactions.slice(0, 3).map((t: any) => `${t.type === 'send' ? 'Sent' : 'Received'} $${t.amount} to ${t.recipient}`).join('; ') : 'none'}

Guidelines:
- Be friendly, concise, and helpful
- Answer any question accurately and naturally, not just payment-related ones
- For send money requests, ask for recipient and amount if not provided
- For currency conversion, ask for amount and currencies if not provided
- For balance inquiries, use the current balance from context
- For transaction history, describe recent activity if available
- Never make up transaction data not in context
- Keep responses under 3 sentences for simple questions; allow longer responses for complex questions
- Be conversational and engaging, like ChatGPT`;

    const completion = await openai.chat.completions.create({
      model: 'openai/gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const reply = completion.choices[0]?.message?.content?.trim() || "I'm here to help with cross-border payments. Would you like to send money, convert currency, check your balance, or view transactions?";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
