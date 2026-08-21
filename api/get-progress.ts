export default async function handler(req: any, res: any) {
  const key = (req.query?.sessionId as string) || 'default';
  // In serverless, localStorage on the client handles primary progress storage
  return res.status(200).json({ entries: [] });
}
