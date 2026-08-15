import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).send('Method not allowed');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return res.status(500).json({ error: 'Supabase not configured' });

  const id = req.query?.id as string;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: row, error } = await supabase
    .from('resume_shares')
    .select('data')
    .eq('id', id)
    .single();

  if (error || !row) return res.status(404).json({ error: 'Not found' });
  return res.status(200).json({ data: row.data });
}
