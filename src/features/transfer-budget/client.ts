const ORIGIN = 'https://hytdpmtahcmztezhbooc.supabase.co';
const TABLES = new Set(['products_public', 'categories', 'brands', 'blog_posts', 'site_pages']);
export type TransferMode = 'normal' | 'warning' | 'limited' | 'disabled' | 'unavailable';
export function catalogueGateway(input: string): string | null {
  let url: URL; try { url = new URL(input); } catch { return null; }
  const table = url.pathname.match(/^\/rest\/v1\/([a-z_]+)$/)?.[1];
  if (url.origin !== ORIGIN || !table || !TABLES.has(table)) return null;
  return `/api/catalog-data?path=${encodeURIComponent(url.pathname + url.search)}`;
}
export function catalogueMedia(bucket: string, path: string) {
  return `/api/catalog-media?bucket=${encodeURIComponent(bucket)}&path=${encodeURIComponent(path)}`;
}
export async function protectedCatalogueFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const request = new Request(input, init);
  const gateway = import.meta.env.PROD && ['GET', 'HEAD'].includes(request.method) ? catalogueGateway(request.url) : null;
  const response = gateway ? await fetch(gateway, { method: request.method, headers: request.headers, signal: request.signal }) : await fetch(request);
  const mode = response.headers.get('X-Ufuk-Transfer-Mode');
  if (gateway && typeof window !== 'undefined' && ['normal', 'warning', 'limited', 'disabled', 'unavailable'].includes(mode ?? '')) {
    window.dispatchEvent(new CustomEvent('ufuk-transfer-mode', { detail: { mode, resetAt: response.headers.get('X-Ufuk-Transfer-Reset') } }));
  }
  return response;
}
