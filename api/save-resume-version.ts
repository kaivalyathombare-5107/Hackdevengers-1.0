export default async function handler(req: any, res: any) {
  const { version } = req.body || {};
  return res.status(200).json({ success: true, version });
}
