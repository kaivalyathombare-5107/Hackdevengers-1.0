const memoryProgress = new Map<string, any[]>();

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { sessionId, ...entry } = req.body || {};
    const key = sessionId || 'default';
    const list = memoryProgress.get(key) || [];
    const newEntry = {
      id: 'prog_' + Date.now(),
      date: new Date().toISOString(),
      ...entry,
    };
    list.push(newEntry);
    memoryProgress.set(key, list.slice(-30));
    return res.status(200).json({ success: true, entry: newEntry });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Internal server error' });
  }
}
