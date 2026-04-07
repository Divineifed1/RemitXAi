export type MessageRole = 'user' | 'ai';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  type?: 'text' | 'transaction' | 'conversion';
  transactionData?: TransactionData;
  conversionData?: ConversionData;
}

export interface TransactionData {
  recipient: string;
  amount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed';
}

export interface ConversionData {
  fromAmount: number;
  fromCurrency: string;
  toAmount: number;
  toCurrency: string;
  rate: number;
}

export interface IntentResult {
  type: 'send_money' | 'convert_currency' | 'unknown';
  data?: {
    amount?: number;
    recipient?: string;
    fromCurrency?: string;
    toCurrency?: string;
  };
}

export type VoiceState = 'idle' | 'listening' | 'processing';