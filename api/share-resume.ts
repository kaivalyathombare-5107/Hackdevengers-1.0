import { createClient } from '@supabase/supabase-js';

const memoryShares = new Map<string, any>();

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const data = req.body?.data;
    if (!data) return res.status(400).json({ error: 'Missing data' });

    const supabase = getSupabase();
    if (supabase) {
      const { data: row, error } = await supabase
        .from('resume_shares')
        .insert({ data })
        .select('id')
        .single();
      if (!error && row) {
        return res.status(200).json({ id: row.id });
      }
    }

    const shareId = 'share_' + Math.random().toString(36).slice(2, 11);
    memoryShares.set(shareId, data);
    return res.status(200).json({ id: shareId });
  } catch (error: any) {
    console.error('share-resume error:', error);
    return res.status(500).json({ error: error?.message || 'Internal server error' });
  }
}
