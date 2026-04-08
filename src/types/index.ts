export type MessageRole = 'user' | 'ai';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  type?: 'text' | 'transaction' | 'conversion' | 'confirmation' | 'alert' | 'insight';
  transactionData?: TransactionData;
  conversionData?: ConversionData;
  confirmationData?: ConfirmationData;
  alertData?: Alert;
  insightData?: Insight;
}

export interface ConfirmationData {
  recipientName: string;
  walletAddress: string;
  amount: number;
  currency: string;
}

export interface TransactionData {
  recipient: string;
  amount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed';
  type?: 'sent' | 'received';
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

export interface Recipient {
  id: string;
  name: string;
  walletAddress: string;
}

export type ChatState = 'idle' | 'awaiting_wallet' | 'confirming_payment' | 'awaiting_save_confirmation';

export interface PendingTransaction {
  recipientName: string;
  amount: number;
  walletAddress?: string;
}

export interface Transaction {
  id: string;
  name: string;
  amount: number;
  currency: string;
  status: 'sent' | 'received' | 'pending' | 'failed';
  type: 'sent' | 'received';
  timestamp: Date;
}

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  symbol: string;
}

export interface WalletData {
  balance: number;
  currency: string;
}

export interface Alert {
  id: string;
  type: 'incoming' | 'insight' | 'warning';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export interface Insight {
  id: string;
  type: 'rate_change' | 'frequent_recipient' | 'savings' | 'recommendation';
  title: string;
  message: string;
  action?: string;
  triggered: boolean;
}