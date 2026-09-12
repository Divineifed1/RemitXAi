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

export interface ParsedIntent {
  action: string | null;
  amount: number | null;
  recipientName: string | null;
  fromCurrency?: string | null;
  toCurrency?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  stellarAddress?: string | null;
  rawMessage: string;
}

export async function parseMessage(message: string): Promise<ParsedIntent> {
  const openai = getOpenAIClient();

  if (!openai) {
    console.warn('OpenAI API key not configured, falling back to regex parsing');
    return fallbackParse(message);
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'openai/gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a payment and currency conversion intent parser. Extract structured information from user messages.
          
Return a JSON object with these exact fields:
- action: "send_money", "convert_currency", "check_balance", "view_history", "offramp", "add_bank", "create_stellar", "check_stellar", "send_stellar", or null
- amount: numeric value in USD, or null
- recipientName: person's name, or null
- fromCurrency: 3-letter currency code (USD, NGN, EUR, GBP, JPY, XLM), or null
- toCurrency: 3-letter currency code (USD, NGN, EUR, GBP, JPY, XLM), or null
- bankName: Nigerian bank name, or null
- accountNumber: bank account number, or null
- accountName: account holder name, or null
- stellarAddress: Stellar public key (starts with G), or null
- rawMessage: the original message

Examples:
- "send $50 to john" → {"action":"send_money","amount":50,"recipientName":"john","fromCurrency":null,"toCurrency":null,"bankName":null,"accountNumber":null,"accountName":null,"stellarAddress":null,"rawMessage":"send $50 to john"}
- "pay sarah 100" → {"action":"send_money","amount":100,"recipientName":"sarah","fromCurrency":null,"toCurrency":null,"bankName":null,"accountNumber":null,"accountName":null,"stellarAddress":null,"rawMessage":"pay sarah 100"}
- "what's my balance" → {"action":"check_balance","amount":null,"recipientName":null,"fromCurrency":null,"toCurrency":null,"bankName":null,"accountNumber":null,"accountName":null,"stellarAddress":null,"rawMessage":"what's my balance"}
- "show transactions" → {"action":"view_history","amount":null,"recipientName":null,"fromCurrency":null,"toCurrency":null,"bankName":null,"accountNumber":null,"accountName":null,"stellarAddress":null,"rawMessage":"show transactions"}
- "convert 100 usd to ngn" → {"action":"convert_currency","amount":100,"recipientName":null,"fromCurrency":"USD","toCurrency":"NGN","bankName":null,"accountNumber":null,"accountName":null,"stellarAddress":null,"rawMessage":"convert 100 usd to ngn"}
- "100 dollars to euro" → {"action":"convert_currency","amount":100,"recipientName":null,"fromCurrency":"USD","toCurrency":"EUR","bankName":null,"accountNumber":null,"accountName":null,"stellarAddress":null,"rawMessage":"100 dollars to euro"}
- "usd to ngn" → {"action":"convert_currency","amount":null,"recipientName":null,"fromCurrency":"USD","toCurrency":"NGN","bankName":null,"accountNumber":null,"accountName":null,"stellarAddress":null,"rawMessage":"usd to ngn"}
- "withdraw 100 to my gtbank account" → {"action":"offramp","amount":100,"recipientName":null,"fromCurrency":null,"toCurrency":null,"bankName":"GTBank","accountNumber":null,"accountName":null,"stellarAddress":null,"rawMessage":"withdraw 100 to my gtbank account"}
- "cash out 50 dollars to opay" → {"action":"offramp","amount":50,"recipientName":null,"fromCurrency":null,"toCurrency":null,"bankName":"Opay","accountNumber":null,"accountName":null,"stellarAddress":null,"rawMessage":"cash out 50 dollars to opay"}
- "transfer 200 to zenith bank 1234567890" → {"action":"offramp","amount":200,"recipientName":null,"fromCurrency":null,"toCurrency":null,"bankName":"Zenith Bank","accountNumber":"1234567890","accountName":null,"stellarAddress":null,"rawMessage":"transfer 200 to zenith bank 1234567890"}
- "add bank account zenith 9876543210 john doe" → {"action":"add_bank","amount":null,"recipientName":null,"fromCurrency":null,"toCurrency":null,"bankName":"Zenith Bank","accountNumber":"9876543210","accountName":"John Doe","stellarAddress":null,"rawMessage":"add bank account zenith 9876543210 john doe"}
- "create a stellar wallet" → {"action":"create_stellar","amount":null,"recipientName":null,"fromCurrency":null,"toCurrency":null,"bankName":null,"accountNumber":null,"accountName":null,"stellarAddress":null,"rawMessage":"create a stellar wallet"}
- "check my stellar balance" → {"action":"check_stellar","amount":null,"recipientName":null,"fromCurrency":null,"toCurrency":null,"bankName":null,"accountNumber":null,"accountName":null,"stellarAddress":null,"rawMessage":"check my stellar balance"}
- "send 10 xlm to GA..." → {"action":"send_stellar","amount":10,"recipientName":null,"fromCurrency":null,"toCurrency":null,"bankName":null,"accountNumber":null,"accountName":null,"stellarAddress":"GA...","rawMessage":"send 10 xlm to GA..."}

Only return the JSON object, no other text.`,
        },
        {
          role: 'user',
          content: message,
        },
      ],
      temperature: 0,
      max_tokens: 150,
    });

    const content = completion.choices[0]?.message?.content?.trim();
    console.log('[OpenAI] Raw response:', content);
    
    if (!content) {
      return fallbackParse(message);
    }

    try {
      const parsed = JSON.parse(content) as ParsedIntent;
      return {
        action: parsed.action || null,
        amount: parsed.amount ?? null,
        recipientName: parsed.recipientName || null,
        fromCurrency: parsed.fromCurrency || null,
        toCurrency: parsed.toCurrency || null,
        bankName: parsed.bankName || null,
        accountNumber: parsed.accountNumber || null,
        accountName: parsed.accountName || null,
        stellarAddress: parsed.stellarAddress || null,
        rawMessage: message,
      };
    } catch (parseError) {
      console.warn('[OpenAI] Failed to parse response as JSON:', content, parseError);
      return fallbackParse(message);
    }
  } catch (error) {
    console.error('[OpenAI] API error:', error);
    return fallbackParse(message);
  }
}

function fallbackParse(message: string): ParsedIntent {
  const normalizedMessage = message.toLowerCase();
  
  let action: string | null = null;
  let amount: number | null = null;
  let recipientName: string | null = null;
  let fromCurrency: string | null = null;
  let toCurrency: string | null = null;

  const wordToNum: Record<string, number> = {
    hundred: 100, fifty: 50, twenty: 20, thirty: 30, forty: 40,
    sixty: 60, seventy: 70, eighty: 80, ninety: 90,
    ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
    sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  };
  
  const currencyWords = 'dollar|dollars|usd|us\\$|naira|nairas|ngn|euro|eur|pound|gbp';
  const sendMatch = normalizedMessage.match(new RegExp(`send\\s+\\$?(\\d+|hundred|fifty|twenty|thirty|forty|sixty|seventy|eighty|ninety|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen)(?:\\s+(?:${currencyWords}))?(?:\\s+(?:to\\s+))?([a-z]+)`, 'i'));
  if (sendMatch) {
    const amountStr = sendMatch[1];
    amount = wordToNum[amountStr] || parseInt(amountStr, 10);
    action = 'send_money';
    recipientName = sendMatch[2];
    return { action, amount, recipientName, rawMessage: message };
  }
  
  const convertMatch = normalizedMessage.match(/convert\s+\$?(\d+)(?:\s+(?:from\s+)?((?!to\b)\w+))?(?:\s+to\s+(\w+))?/i);
  if (convertMatch) {
    amount = parseInt(convertMatch[1], 10);
    const fromCurrencyRaw = convertMatch[2];
    const toCurrencyRaw = convertMatch[3];
    
    fromCurrency = 'USD';
    if (fromCurrencyRaw && !['to'].includes(fromCurrencyRaw.toLowerCase())) {
      if (['dollar', 'dollars', 'usd'].includes(fromCurrencyRaw.toLowerCase())) {
        fromCurrency = 'USD';
      } else if (['naira', 'nairas'].includes(fromCurrencyRaw.toLowerCase())) {
        fromCurrency = 'NGN';
      } else if (['euro', 'eur'].includes(fromCurrencyRaw.toLowerCase())) {
        fromCurrency = 'EUR';
      } else if (['pound', 'gbp'].includes(fromCurrencyRaw.toLowerCase())) {
        fromCurrency = 'GBP';
      } else if (['yen', 'jpy'].includes(fromCurrencyRaw.toLowerCase())) {
        fromCurrency = 'JPY';
      } else if (['xlm', 'stellar'].includes(fromCurrencyRaw.toLowerCase())) {
        fromCurrency = 'XLM';
      } else {
        fromCurrency = fromCurrencyRaw.toUpperCase();
      }
    }
    
    toCurrency = 'NGN';
    if (toCurrencyRaw) {
      if (['naira', 'nairas'].includes(toCurrencyRaw.toLowerCase())) {
        toCurrency = 'NGN';
      } else if (['dollar', 'dollars', 'usd'].includes(toCurrencyRaw.toLowerCase())) {
        toCurrency = 'USD';
      } else if (['euro', 'eur'].includes(toCurrencyRaw.toLowerCase())) {
        toCurrency = 'EUR';
      } else if (['pound', 'gbp'].includes(toCurrencyRaw.toLowerCase())) {
        toCurrency = 'GBP';
      } else if (['yen', 'jpy'].includes(toCurrencyRaw.toLowerCase())) {
        toCurrency = 'JPY';
      } else if (['xlm', 'stellar'].includes(toCurrencyRaw.toLowerCase())) {
        toCurrency = 'XLM';
      } else {
        toCurrency = toCurrencyRaw.toUpperCase();
      }
    }
    
    action = 'convert_currency';
    return { action, amount, recipientName: null, fromCurrency, toCurrency, rawMessage: message };
  }
  
  const quickConvertMatch = normalizedMessage.match(/(\w+)\s+to\s+(\w+)/i);
  if (quickConvertMatch) {
    let from = quickConvertMatch[1].toUpperCase();
    let to = quickConvertMatch[2].toUpperCase();
    if (['naira', 'nairas'].includes(quickConvertMatch[2].toLowerCase())) {
      to = 'NGN';
    }
    if (['dollar', 'dollars', 'usd'].includes(quickConvertMatch[1].toLowerCase())) {
      from = 'USD';
    }
    if (from && to) {
      action = 'convert_currency';
      return { action, amount: null, recipientName: null, fromCurrency: from, toCurrency: to, rawMessage: message };
    }
  }

  const offrampMatch = normalizedMessage.match(/(?:withdraw|cash out|offramp|transfer)\s+(?:\$?(\d+(?:\.\d+)?))?\s*(?:to\s+)?(?:my\s+)?(.+?)(?:\s+(?:account|bank))?(?:\s+(\d+))?$/i);
  if (offrampMatch) {
    const amountStr = offrampMatch[1];
    const bankName = offrampMatch[2]?.trim();
    const accountNumber = offrampMatch[3]?.trim();
    
    if (bankName) {
      action = 'offramp';
      amount = amountStr ? parseFloat(amountStr) : null;
      return {
        action,
        amount,
        recipientName: null,
        fromCurrency: null,
        toCurrency: null,
        bankName: bankName || null,
        accountNumber: accountNumber || null,
        accountName: null,
        rawMessage: message,
      };
    }
  }

  const addBankMatch = normalizedMessage.match(/(?:add|save|link)\s+(?:bank\s+)?(?:account\s+)?(.+?)(?:\s+(\d+))(?:\s+(.+))?$/i);
  if (addBankMatch) {
    const bankName = addBankMatch[1]?.trim();
    const accountNumber = addBankMatch[2]?.trim();
    const accountName = addBankMatch[3]?.trim();
    
    if (bankName && accountNumber) {
      action = 'add_bank';
      return {
        action,
        amount: null,
        recipientName: null,
        fromCurrency: null,
        toCurrency: null,
        bankName,
        accountNumber,
        accountName: accountName || null,
        rawMessage: message,
      };
    }
  }

  if (/\b(create|new|generate)\s+(?:a\s+)?(?:stellar|crypto)\s*(?:wallet|account)?/i.test(normalizedMessage)) {
    action = 'create_stellar';
    return {
      action,
      amount: null,
      recipientName: null,
      fromCurrency: null,
      toCurrency: null,
      bankName: null,
      accountNumber: null,
      accountName: null,
      stellarAddress: null,
      rawMessage: message,
    };
  }

  if (/\b(check|view|show|my)\s+(?:stellar|crypto|balance|wallet)\b/i.test(normalizedMessage)) {
    action = 'check_stellar';
    return {
      action,
      amount: null,
      recipientName: null,
      fromCurrency: null,
      toCurrency: null,
      bankName: null,
      accountNumber: null,
      accountName: null,
      stellarAddress: null,
      rawMessage: message,
    };
  }

  const stellarSendMatch = normalizedMessage.match(/(?:send|transfer)\s+(\d+(?:\.\d+)?)\s*(?:xlm|stellar)?\s*(?:to\s+)?(G[A-Z0-9]{25,56})/i);
  if (stellarSendMatch) {
    const amountStr = stellarSendMatch[1];
    const stellarAddress = stellarSendMatch[2];
    amount = amountStr ? parseFloat(amountStr) : null;
    action = 'send_stellar';
    return {
      action,
      amount,
      recipientName: null,
      fromCurrency: null,
      toCurrency: null,
      bankName: null,
      accountNumber: null,
      accountName: null,
      stellarAddress,
      rawMessage: message,
    };
  }
  
  if (/\b(balance|how much|money left)\b/i.test(normalizedMessage)) {
    action = 'check_balance';
  } else if (/\b(transaction|history|past|recent)\b/i.test(normalizedMessage)) {
    action = 'view_history';
  }

  return {
    action,
    amount,
    recipientName,
    fromCurrency,
    toCurrency,
    rawMessage: message,
  };
}
