import * as StellarSdk from '@stellar/stellar-sdk';

const STELLAR_NETWORK = process.env.STELLAR_NETWORK || 'testnet';
const HORIZON_URL = STELLAR_NETWORK === 'mainnet'
  ? 'https://horizon.stellar.org'
  : 'https://horizon-testnet.stellar.org';

export const server = new StellarSdk.Horizon.Server(HORIZON_URL);

export const NETWORK_PASSPHRASE = STELLAR_NETWORK === 'mainnet'
  ? StellarSdk.Networks.PUBLIC
  : StellarSdk.Networks.TESTNET;

// USDC issuer addresses (from Circle's official documentation)
const USDC_ISSUER_TESTNET = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
const USDC_ISSUER_MAINNET = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';

export const USDC_ISSUER = STELLAR_NETWORK === 'mainnet' ? USDC_ISSUER_MAINNET : USDC_ISSUER_TESTNET;

export const USDC_ASSET = new StellarSdk.Asset('USDC', USDC_ISSUER);
export const NATIVE_ASSET = StellarSdk.Asset.native();

export async function createAccount(): Promise<StellarSdk.Keypair> {
  return StellarSdk.Keypair.random();
}

export async function fundAccount(accountId: string): Promise<void> {
  try {
    const friendbotUrl = `https://friendbot.stellar.org?addr=${accountId}`;
    const response = await fetch(friendbotUrl);
    if (!response.ok) {
      throw new Error(`Friendbot failed: ${response.status}`);
    }
  } catch (error) {
    console.error('Friendbot error:', error);
    throw error;
  }
}

export async function getAccountBalance(accountId: string): Promise<string[]> {
  try {
    const account = await server.accounts().accountId(accountId).call();
    return account.balances.map(b => {
      if (b.asset_type === 'native') {
        return `${b.balance} XLM`;
      }
      const assetCode = 'asset_code' in b ? b.asset_code : 'XLM';
      const issuer = 'asset_issuer' in b ? b.asset_issuer : '';
      return `${b.balance} ${assetCode}${issuer ? ` (${issuer.slice(0, 8)}...)` : ''}`;
    });
  } catch (error) {
    console.error('Error getting balance:', error);
    return ['0 XLM'];
  }
}

export async function getUsdcBalance(accountId: string): Promise<string> {
  try {
    const account = await server.accounts().accountId(accountId).call();
    const usdcBalance = account.balances.find(b => 
      'asset_code' in b && b.asset_code === 'USDC'
    );
    return usdcBalance ? usdcBalance.balance : '0';
  } catch (error) {
    console.error('Error getting USDC balance:', error);
    return '0';
  }
}

export async function getAccountDetails(accountId: string): Promise<any> {
  try {
    const account = await server.accounts().accountId(accountId).call();
    return {
      id: account.id,
      sequence: account.sequence,
      balances: account.balances,
      account_id: account.account_id,
    };
  } catch (error) {
    console.error('Error getting account details:', error);
    return null;
  }
}

export async function getTransactionHistory(accountId: string, limit = 20): Promise<any[]> {
  try {
    const transactions = await server
      .transactions()
      .forAccount(accountId)
      .limit(limit)
      .order('desc')
      .call();
    return transactions.records.map(t => ({
      id: t.id,
      hash: t.hash,
      created_at: t.created_at,
      source_account: t.source_account,
    }));
  } catch (error) {
    console.error('Error getting transaction history:', error);
    return [];
  }
}

export async function sendPayment(
  sourceSecret: string,
  destinationAccountId: string,
  amount: string | number,
  asset: StellarSdk.Asset = NATIVE_ASSET
): Promise<any> {
  try {
    const sourceKeypair = StellarSdk.Keypair.fromSecret(sourceSecret);
    const sourceAccount = await server.accounts().accountId(sourceKeypair.publicKey()).call();

    const paymentOperation = StellarSdk.Operation.payment({
      source: sourceAccount.id,
      destination: destinationAccountId,
      asset,
      amount: String(amount),
    });

    const transaction = new StellarSdk.TransactionBuilder(sourceAccount as any, {
      fee: String(await server.fetchBaseFee()),
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(paymentOperation)
      .setTimeout(30)
      .build();

    transaction.sign(sourceKeypair);

    const result = await server.submitTransaction(transaction);
    return result;
  } catch (error) {
    console.error('Error sending payment:', error);
    throw error;
  }
}

export async function sendUsdc(
  sourceSecret: string,
  destinationAccountId: string,
  amount: string | number
): Promise<any> {
  return sendPayment(sourceSecret, destinationAccountId, amount, USDC_ASSET);
}

export async function checkAccountExists(accountId: string): Promise<boolean> {
  try {
    await server.accounts().accountId(accountId).call();
    return true;
  } catch (error) {
    return false;
  }
}

export function isValidStellarAddress(address: string): boolean {
  try {
    StellarSdk.Keypair.fromPublicKey(address);
    return true;
  } catch {
    return false;
  }
}