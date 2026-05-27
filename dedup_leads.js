import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './dashboard/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('leads')
    .select('id, nome, telefone, created_at')
    .order('created_at', { ascending: true });
  if (error) {
    console.error('Error fetching leads:', error);
    return;
  }
  
  const phoneMap = {};
  const duplicates = [];
  
  data.forEach(lead => {
    if (!lead.telefone) return;
    if (phoneMap[lead.telefone]) {
      duplicates.push(lead.id);
      console.log(`Duplicate found for phone ${lead.telefone}: keeping ${phoneMap[lead.telefone].id}, deleting ${lead.id}`);
    } else {
      phoneMap[lead.telefone] = lead;
    }
  });

  if (duplicates.length > 0) {
    console.log(`Found ${duplicates.length} duplicates. Deleting...`);
    // Delete duplicates
    const { error: delError } = await supabase.from('leads').delete().in('id', duplicates);
    if (delError) console.error('Delete error:', delError);
    else console.log('Duplicates deleted successfully.');
  } else {
    console.log('No duplicates found.');
  }
}
run();
