import { supabase } from '../lib/supabase';
import { Contact } from '../types';

export const CloudRepository = {
  async getAll(userId: string): Promise<Contact[]> {
    const { data, error } = await supabase
      .from('contacts')
      .select('data')
      .eq('user_id', userId);
    if (error) throw error;
    return (data ?? []).map((row: any) => row.data as Contact);
  },

  async upsert(userId: string, contact: Contact): Promise<void> {
    const { error } = await supabase.from('contacts').upsert(
      { id: contact.id, user_id: userId, data: contact, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    );
    if (error) throw error;
  },

  async delete(contactId: string): Promise<void> {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contactId);
    if (error) throw error;
  },

  async syncAll(userId: string, contacts: Contact[]): Promise<void> {
    const rows = contacts.map(c => ({
      id: c.id,
      user_id: userId,
      data: c,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase
      .from('contacts')
      .upsert(rows, { onConflict: 'id' });
    if (error) throw error;
  },
};
