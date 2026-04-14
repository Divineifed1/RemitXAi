export interface ParsedIntent {
  action: string | null;
  amount: number | null;
  recipientName: string | null;
  rawMessage: string;
}

export function parseMessage(message: string): ParsedIntent {
  const normalizedMessage = message.toLowerCase();
  
  let action: string | null = null;
  let amount: number | null = null;
  let recipientName: string | null = null;

  const sendMoneyPatterns = [
    /send\s+(?:money\s+)?to\s+(\w+)/i,
    /send\s+(\d+(?:\.\d+)?)\s+(?:dollars?|usd)?\s+to\s+(\w+)/i,
    /pay\s+(\w+)\s+(\d+(?:\.\d+)?)/i,
    /transfer\s+(\d+(?:\.\d+)?)\s+to\s+(\w+)/i,
    /(\d+(?:\.\d+)?)\s+(?:dollars?|usd)?\s+to\s+(\w+)/i,
  ];

  for (const pattern of sendMoneyPatterns) {
    const match = normalizedMessage.match(pattern);
    if (match) {
      action = 'send_money';
      
      if (pattern.toString().includes('send') && pattern.toString().includes('\\d')) {
        amount = parseFloat(match[1]);
        recipientName = match[2];
      } else if (pattern.toString().includes('pay')) {
        recipientName = match[1];
        amount = parseFloat(match[2]);
      } else {
        recipientName = match[1];
      }
      break;
    }
  }

  if (!action) {
    const dollarMatch = normalizedMessage.match(/(\d+(?:\.\d+)?)\s*(?:dollars?|usd)/);
    if (dollarMatch) {
      amount = parseFloat(dollarMatch[1]);
    }
    
    const nameWords = normalizedMessage.match(/to\s+(\w+)/);
    if (nameWords && action === 'send_money') {
      recipientName = nameWords[1];
    }
  }

  return {
    action,
    amount,
    recipientName,
    rawMessage: message,
  };
}