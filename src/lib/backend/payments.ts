import { findRecipientByName } from './recipients';
import { getBalance, deduct, recordTransaction } from './wallet';

export interface PaymentResult {
  success: boolean;
  message: string;
  amount?: number;
  recipient?: string;
}

export function sendPayment(name: string, amount: number): PaymentResult {
  const recipient = findRecipientByName(name);
  
  if (!recipient) {
    return {
      success: false,
      message: `Recipient "${name}" not found. Please add them first.`,
    };
  }
  
  if (amount <= 0) {
    return {
      success: false,
      message: 'Invalid amount. Please enter a positive number.',
    };
  }
  
  if (!deduct(amount)) {
    return {
      success: false,
      message: `Insufficient balance. Current balance: $${getBalance()}`,
    };
  }
  
  recordTransaction(recipient.name, amount, 'send');
  
  return {
    success: true,
    message: `Successfully sent $${amount} to ${recipient.name}`,
    amount,
    recipient: recipient.name,
  };
}