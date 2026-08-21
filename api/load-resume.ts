import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export default async function handler(req: any, res: any) {
  try {
    const id = (req.query?.id || req.body?.id) as string;
    if (!id) return res.status(400).json({ error: 'Missing id' });

    const supabase = getSupabase();
    if (supabase) {
      const { data: row, error } = await supabase
        .from('resume_shares')
        .select('data')
        .eq('id', id)
        .single();
      if (!error && row) {
        return res.status(200).json({ data: row.data });
      }
    }

    return res.status(404).json({ error: 'Resume not found' });
  } catch (error: any) {
    console.error('load-resume error:', error);
    return res.status(500).json({ error: error?.message || 'Internal server error' });
  }
}
