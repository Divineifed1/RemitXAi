import { getRecipients, addRecipient, findRecipientByName } from '@/lib/supabase-db';

export { getRecipients, addRecipient, findRecipientByName };

export interface Recipient {
  name: string;
  wallet: string;
}