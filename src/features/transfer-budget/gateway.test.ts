// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import mediaHandler, { mediaTarget } from '../../../api/catalog-media.js';
import dataHandler, { dataTarget } from '../../../api/catalog-data.js';
import adminHandler from '../../../api/transfer-budget.js';
import { boundedBody } from '../../../server/transfer.js';
import { catalogueGateway } from './client';
const state = { enabled: true, allowed: true, usedBytes: 1000, limitBytes: 120_000_000, resetAt: '2026-11-18T21:00:00Z' };
function response() {
  return { code: 0, headers: {} as Record<string, unknown>, body: undefined as unknown,
    setHeader(name: string, value: unknown) { this.headers[name] = value; },
    status(code: number) { this.code = code; return this; },
    json(body: unknown) { this.body = body; return this; }, send(body: unknown) { this.body = body; return this; }, end() { return this; } };
}
beforeEach(() => { vi.stubEnv('UFUK_SUPABASE_ANON_KEY', 'TEST_ONLY_PUBLIC_KEY'); vi.stubEnv('UFUK_TRANSFER_GUARD', 'TEST_ONLY_SERVER_GUARD'); });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe('shared server transfer protection', () => {
  it('only intercepts approved catalogue reads, never auth, orders, RPCs or another host', () => {
    const root = 'https://hytdpmtahcmztezhbooc.supabase.co';
    expect(catalogueGateway(root + '/rest/v1/products_public?limit=24')).toMatch(/^\/api\/catalog-data/);
    for (const path of ['/auth/v1/token', '/rest/v1/orders', '/rest/v1/rpc/place_order']) expect(catalogueGateway(root + path)).toBeNull();
    expect(catalogueGateway('https://other.test/rest/v1/products_public')).toBeNull();
    expect(dataTarget('https://evil.test/rest/v1/products_public')).toBeNull();
    expect(dataTarget('/rest/v1/products')).toBeNull();
    expect(dataTarget('/rest/v1/products_public?limit=10000')).toBeNull();
    expect(mediaTarget('avatars', 'user/private.png')).toBeNull();
    expect(mediaTarget('product-images', '../private.png')).toBeNull();
    expect(mediaTarget('product-images', 'bad%2fpath')).toBeNull();
  });
  it('blocks new image bodies globally when reservation is denied', async () => {
    const fetcher = vi.fn(async (url: string, init: RequestInit) => {
      if (init.method === 'HEAD') return new Response(null, { status: 200, headers: { 'Content-Length': '300000' } });
      if (url.includes('ufuk_transfer_reserve')) return Response.json({ ...state, allowed: false, usedBytes: 120_000_000 });
      throw new Error('Image body must not be downloaded');
    });
    vi.stubGlobal('fetch', fetcher); const res = response();
    await mediaHandler({ method: 'GET', query: { bucket: 'product-images', path: 'products/router.jpg' }, headers: {} }, res);
    expect(res.code).toBe(429); expect(res.headers['X-Ufuk-Transfer-Mode']).toBe('limited');
    expect(String(fetcher.mock.calls[1][0])).toContain('ufuk_transfer_reserve');
    expect(fetcher.mock.calls).toHaveLength(2);
  });
  it('accounts an admitted image once and serves only anonymous-RLS catalogue media through a sandboxed cacheable response', async () => {
    const fetcher = vi.fn(async (url: string, init: RequestInit) => {
      if (url.includes('/rpc/')) return Response.json(state);
      expect((init.headers as Record<string, string>).Authorization).toBe('Bearer TEST_ONLY_PUBLIC_KEY');
      return new Response(init.method === 'HEAD' ? null : 'img', { headers: { 'Content-Length': '3', 'Content-Type': 'image/svg+xml' } });
    });
    vi.stubGlobal('fetch', fetcher); const res = response();
    await mediaHandler({ method: 'GET', query: { bucket: 'product-images', path: 'router.svg' }, headers: {} }, res);
    expect(res.code).toBe(200); expect(res.headers['Content-Security-Policy']).toContain('sandbox');
    expect(res.headers['Cache-Control']).toContain('s-maxage=3300');
    const reserve = fetcher.mock.calls.find(([url]) => url.includes('ufuk_transfer_reserve'))!;
    expect(JSON.parse(reserve[1].body as string)).toMatchObject({ p_bytes: 4099, p_essential: false });
    expect(fetcher.mock.calls.filter(([url]) => url.includes('ufuk_transfer_finish'))).toHaveLength(1);
  });
  it('preserves the customer JWT, counts essential catalogue data and forwards the exact total', async () => {
    const fetcher = vi.fn(async (url: URL | string, init: RequestInit) => {
      if (String(url).includes('/rpc/')) return Response.json({ ...state, usedBytes: 130_000_000 });
      expect((init.headers as Record<string, string>).Authorization).toBe('Bearer TEST_ONLY_CUSTOMER_JWT');
      expect((init.headers as Record<string, string>).Accept).toBe('application/vnd.pgrst.object+json');
      return new Response('[]', { status: 206, headers: { 'Content-Type': 'application/json', 'Content-Range': '0-23/1122' } });
    });
    vi.stubGlobal('fetch', fetcher); const res = response();
    await dataHandler({ method: 'GET', query: { path: '/rest/v1/products_public?limit=24' }, headers: { authorization: 'Bearer TEST_ONLY_CUSTOMER_JWT', accept: 'application/vnd.pgrst.object+json', prefer: 'count=exact' } }, res);
    expect(res.code).toBe(206); expect(res.headers['content-range']).toBe('0-23/1122');
    const reserve = fetcher.mock.calls.find(([url]) => String(url).includes('ufuk_transfer_reserve'))!;
    expect(JSON.parse(reserve[1].body as string).p_essential).toBe(true);
    expect(res.headers['X-Ufuk-Transfer-Mode']).toBe('limited');
  });
  it('fails closed when shared accounting is unavailable and never reports fictitious zero usage', async () => {
    const fetcher = vi.fn(async () => new Response('restricted', { status: 402 })); vi.stubGlobal('fetch', fetcher);
    const res = response(); await dataHandler({ method: 'GET', query: { path: '/rest/v1/categories' }, headers: {} }, res);
    expect(res.code).toBe(503); expect(res.headers['X-Ufuk-Transfer-Mode']).toBe('unavailable');
    expect(res.body).not.toHaveProperty('usedBytes'); expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('rejects unsigned settings changes before contacting the database', async () => {
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher); const res = response();
    await adminHandler({ method: 'PATCH', body: { enabled: false, limitMb: 999 }, headers: {} }, res);
    expect(res.code).toBe(401); expect(fetcher).not.toHaveBeenCalled();
  });
  it('cancels oversized upstream transfers instead of buffering unbounded responses', async () => {
    const cancel = vi.fn(); let reads = 0;
    const source = new ReadableStream({ pull(controller) { if (reads++ === 0) controller.enqueue(new Uint8Array(15)); else controller.enqueue(new Uint8Array(100)); }, cancel });
    const result = await boundedBody(new Response(source), 10);
    expect(result.body).toBeNull(); expect(cancel).toHaveBeenCalledTimes(1);
  });
});
