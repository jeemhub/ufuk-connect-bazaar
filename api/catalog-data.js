import { PROJECT_ORIGIN, OVERHEAD, configuration, reserve, finish, annotate, boundedBody, unavailable } from '../server/transfer.js';
const TABLES = new Set(['products_public', 'categories', 'brands', 'blog_posts', 'site_pages']);
export function dataTarget(raw) {
  if (typeof raw !== 'string' || raw.length > 12_000) return null;
  const url = new URL(raw, PROJECT_ORIGIN);
  const match = url.pathname.match(/^\/rest\/v1\/([a-z_]+)$/);
  if (url.origin !== PROJECT_ORIGIN || !match || !TABLES.has(match[1]) || url.username || url.password || url.hash) return null;
  const limit = Number(url.searchParams.get('limit') ?? 1000);
  if (!Number.isInteger(limit) || limit < 1 || limit > 1000) return null;
  return url;
}
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (!['GET', 'HEAD'].includes(req.method)) return res.status(405).end();
  let target; try { target = dataTarget(req.query.path); } catch { /* Reject malformed URLs. */ }
  if (!target) return res.status(400).json({ message: 'Invalid catalogue request' });
  let booking; let state;
  try {
    const { key } = configuration();
    const maximum = 2 * 1024 * 1024;
    booking = await reserve(maximum + OVERHEAD, true); state = booking.state;
    const headers = { apikey: key, Authorization: req.headers.authorization || `Bearer ${key}`, Accept: ['application/json', 'application/vnd.pgrst.object+json', 'application/vnd.pgrst.array+json'].includes(req.headers.accept) ? req.headers.accept : 'application/json' };
    for (const name of ['prefer', 'range', 'range-unit']) if (typeof req.headers[name] === 'string') headers[name] = req.headers[name];
    const upstream = await fetch(target, { method: req.method, headers, redirect: 'error', signal: AbortSignal.timeout(15_000) });
    const result = await boundedBody(upstream, maximum);
    try { state = await finish(booking.id, result.bytes + OVERHEAD); } catch { /* Keep full reservation if settlement fails. */ }
    annotate(res, state);
    if (!result.body) return res.status(413).json({ message: 'Catalogue response is too large; request fewer records.' });
    for (const name of ['content-type', 'content-range', 'range-unit']) { const value = upstream.headers.get(name); if (value) res.setHeader(name, value); }
    return res.status(upstream.status).send(result.body);
  } catch {
    // Unknown transfers retain the reservation. Never report an invented zero.
    return unavailable(res);
  }
}
