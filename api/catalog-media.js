import { once } from 'node:events';
import { PROJECT_ORIGIN, IMAGE_BUCKETS, OVERHEAD, configuration, reserve, finish, annotate, boundedBody, unavailable } from '../server/transfer.js';
export function mediaTarget(bucket, path) {
  if (typeof bucket !== 'string' || !IMAGE_BUCKETS.has(bucket) || typeof path !== 'string' || path.length > 2000 || /[\\\x00-\x1f\x7f]/.test(path)) return null;
  const parts = path.split('/');
  if (parts.some(part => !part || part === '.' || part === '..' || /%2f|%5c/i.test(part))) return null;
  return `${PROJECT_ORIGIN}/storage/v1/object/authenticated/${bucket}/${parts.map(encodeURIComponent).join('/')}`;
}
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  let target; try { target = mediaTarget(req.query.bucket, req.query.path); } catch { /* Reject malformed input. */ }
  if (!target) return res.status(400).end();
  res.setHeader('Cache-Control', 'no-store');
  let booking;
  try {
    const { key } = configuration();
    const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Accept-Encoding': 'identity' };
    // Anonymous RLS is still enforced. Personal buckets can never enter this route.
    const head = await fetch(target, { method: 'HEAD', headers, redirect: 'error', signal: AbortSignal.timeout(12_000) });
    if (!head.ok) return res.status(head.status).end();
    const length = Number(head.headers.get('content-length'));
    if (!Number.isSafeInteger(length) || length <= 0 || length > 6 * 1024 * 1024 - OVERHEAD) return res.status(413).end();
    booking = await reserve(length + OVERHEAD, false);
    if (!booking.state.allowed) {
      annotate(res, booking.state);
      res.setHeader('Retry-After', Math.max(1, Math.ceil((Date.parse(booking.state.resetAt) - Date.now()) / 1000)));
      return res.status(429).end();
    }
    const upstream = await fetch(target, { headers, redirect: 'error', signal: AbortSignal.timeout(15_000) });
    const result = await boundedBody(upstream, length);
    let state = booking.state;
    try { state = await finish(booking.id, result.bytes + OVERHEAD); } catch { /* Reservation stays charged. */ }
    annotate(res, state);
    if (!result.body) return res.status(413).end();
    if (!upstream.ok) return res.status(upstream.status).end();
    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
    if (!/^image\/(?:jpeg|png|webp|avif|gif|svg\+xml|x-icon)(?:;|$)/i.test(contentType)) res.setHeader('Content-Disposition', 'attachment; filename="catalogue-file"');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Only catalogue media which passed anonymous RLS is cached; never user files.
    res.setHeader('Cache-Control', 'public, max-age=3300, s-maxage=3300');
    if (result.body.length > 4_000_000) {
      // Stream large originals rather than hitting Vercel's buffered payload limit.
      res.status(200);
      for (let offset = 0; offset < result.body.length; offset += 64 * 1024) {
        if (!res.write(result.body.subarray(offset, offset + 64 * 1024))) await once(res, 'drain');
      }
      return res.end();
    }
    return res.status(200).send(result.body);
  } catch { if (res.headersSent) return res.end(); return unavailable(res); }
}
