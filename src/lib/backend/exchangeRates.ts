const EXCHANGE_API = 'https://api.exchangerate.host/live?access_key=de3f6bf14d30f8a98bad77c5845c2b7d&symbols=USD,EUR';

export interface ExchangeRates {
  [key: string]: number;
}

export interface RateData {
  rates: ExchangeRates;
  timestamp: number;
}

let cachedRates: RateData | null = null;
let cacheTime = 0;
const CACHE_DURATION = 60 * 1000;

export async function getExchangeRates(): Promise<ExchangeRates> {
  const now = Date.now();
  
  if (cachedRates && now - cacheTime < CACHE_DURATION) {
    return cachedRates.rates;
  }

  console.log('Fetching exchange rates from API:', EXCHANGE_API);
  
  try {
    const response = await fetch(EXCHANGE_API);
    if (!response.ok) {
      throw new Error('Failed to fetch rates');
    }
    
    const data = await response.json();
    console.log('Raw API response:', data);
    console.log('Processed exchange rates:', data.rates);
    
    cachedRates = {
      rates: data.rates,
      timestamp: now,
    };
    cacheTime = now;
    
    return data.rates;
  } catch (error) {
    console.error('Exchange rate API error:', error);
    
    if (cachedRates) {
      return cachedRates.rates;
    }
    
    return {
      USD: 1,
      NGN: 1400,
      EUR: 0.92,
      GBP: 0.79,
      JPY: 148.5,
      XLM: 0.0035,
    };
  }
}

export async function convertCurrency(
  amount: number,
  from: string,
  to: string
): Promise<{ amount: number; rate: number }> {
  const rates = await getExchangeRates();
  
  const fromRate = rates[from] || 1;
  const toRate = rates[to] || 1;
  
  const usdAmount = amount / fromRate;
  const convertedAmount = usdAmount * toRate;
  
  return {
    amount: Math.round(convertedAmount * 100) / 100,
    rate: toRate / fromRate,
  };
}