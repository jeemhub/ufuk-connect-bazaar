import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ sign: vi.fn(async () => 'https://example.test/signed-image'), intersect: undefined as IntersectionObserverCallback | undefined }));
vi.mock('@/auth/AuthProvider', () => ({ useAuth: () => ({ user: null, loading: false }) }));
vi.mock('@/lib/storageSigning', () => ({ signStorageReference: state.sign, mediaTiming: () => ({ stale: 3_000_000, refresh: 3_300_000 }) }));
import { StorageImage } from './StorageMedia';
const source = 'https://hytdpmtahcmztezhbooc.supabase.co/storage/v1/object/public/product-images/test.webp';
beforeEach(() => {
  state.sign.mockClear();
  vi.stubGlobal('IntersectionObserver', class { constructor(callback: IntersectionObserverCallback) { state.intersect = callback; } observe() {} disconnect() {} });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it('does not sign offscreen media, then reuses the same signed URL when navigating back', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const view = () => <QueryClientProvider client={client}><StorageImage src={source} alt="catalogue" /></QueryClientProvider>;
  const first = render(view());
  expect(state.sign).not.toHaveBeenCalled(); expect(screen.getByAltText('catalogue')).not.toHaveAttribute('src');
  act(() => state.intersect?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
  await waitFor(() => expect(screen.getByAltText('catalogue')).toHaveAttribute('src', 'https://example.test/signed-image'));
  first.unmount(); render(view());
  act(() => state.intersect?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
  await waitFor(() => expect(screen.getByAltText('catalogue')).toHaveAttribute('src', 'https://example.test/signed-image'));
  expect(state.sign).toHaveBeenCalledTimes(1); client.clear();
});
