import { rpc, unavailable } from '../server/transfer.js';
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (!['GET', 'PATCH'].includes(req.method)) return res.status(405).end();
  if (typeof req.headers.authorization !== 'string' || !req.headers.authorization.startsWith('Bearer ')) return res.status(401).end();
  let body = {};
  try { if (req.method === 'PATCH') body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {}; } catch { return res.status(400).end(); }
  if (req.method === 'PATCH' && (!Number.isInteger(body.limitMb) || body.limitMb < 1 || body.limitMb > 1000 || typeof body.enabled !== 'boolean')) return res.status(400).end();
  try {
    // Supabase verifies the caller's JWT and its existing admin role in the RPC.
    const state = await rpc('ufuk_transfer_admin', req.method === 'PATCH' ? { p_limit_mb: body.limitMb, p_enabled: body.enabled } : {}, req.headers.authorization);
    return res.status(200).json(state);
  } catch { return unavailable(res); }
}
