import { randomUUID } from 'node:crypto';
export const PROJECT_ORIGIN = 'https://hytdpmtahcmztezhbooc.supabase.co';
export const IMAGE_BUCKETS = new Set(['product-images', 'brand-logos', 'blog-images', 'project-images']);
export const OVERHEAD = 4096; // Conservative allowance for headers and accounting calls.
export function configuration() {
  const key = process.env.UFUK_SUPABASE_ANON_KEY;
  const guard = process.env.UFUK_TRANSFER_GUARD;
  if (!key || !guard) throw new Error('Protection setup is incomplete');
  return { key, guard };
}
export async function rpc(name, payload, token, fetcher = fetch) {
  const { key } = configuration();
  const response = await fetcher(`${PROJECT_ORIGIN}/rest/v1/rpc/${name}`, {
    method: 'POST', headers: { apikey: key, Authorization: token || `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload), signal: AbortSignal.timeout(12_000), redirect: 'error',
  });
  if (!response.ok) throw new Error('Shared transfer counter unavailable');
  return response.json();
}
export async function reserve(bytes, essential) {
  const { guard } = configuration(); const id = randomUUID();
  const state = await rpc('ufuk_transfer_reserve', { p_guard: guard, p_request: id, p_bytes: bytes, p_essential: essential });
  return { id, state };
}
export async function finish(id, actual) {
  return rpc('ufuk_transfer_finish', { p_guard: configuration().guard, p_request: id, p_actual: actual });
}
export function annotate(res, state) {
  const mode = !state.enabled ? 'disabled' : state.usedBytes >= state.limitBytes ? 'limited' : state.usedBytes >= state.limitBytes * 0.8 ? 'warning' : 'normal';
  res.setHeader('X-Ufuk-Transfer-Mode', mode);
  res.setHeader('X-Ufuk-Transfer-Reset', state.resetAt);
}
export async function boundedBody(response, maximum) {
  if (!response.body) return { body: Buffer.alloc(0), bytes: 0 };
  const reader = response.body.getReader(); const chunks = []; let bytes = 0;
  try {
    for (;;) {
      const part = await reader.read(); if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > maximum) { await reader.cancel(); return { body: null, bytes }; }
      chunks.push(Buffer.from(part.value));
    }
    return { body: Buffer.concat(chunks), bytes };
  } finally { reader.releaseLock(); }
}
export function unavailable(res) {
  res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Ufuk-Transfer-Mode', 'unavailable');
  return res.status(503).json({ code: 'TRANSFER_COUNTER_UNAVAILABLE', message: 'خدمة البيانات غير متاحة مؤقتًا. يرجى المحاولة لاحقًا.' });
}
