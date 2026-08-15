import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const data = req.body?.data;
  if (!data) return res.status(400).json({ error: 'Missing data' });

  const { data: row, error } = await supabase
    .from('resume_shares')
    .insert({ data })
    .select('id')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ id: row.id });
}
