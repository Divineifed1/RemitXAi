import { createAccount } from '../src/lib/stellar';

async function test() {
  const keypair = await createAccount();
  console.log('Public Key:', keypair.publicKey());
  console.log('Secret Key:', keypair.secret());
  console.log('Length:', keypair.publicKey().length);
}

test().catch(console.error);