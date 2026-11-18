import type { ReactNode } from 'react';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ user: 'dealer-a', tier: 'dealer', page: vi.fn(), categories: vi.fn(async () => ({ category: 'networking' })) }));
vi.mock('@/auth/AuthProvider', () => ({ useAuth: () => ({ user: state.user ? { id: state.user } : null, pricingTier: state.tier, loading: false }) }));
vi.mock('@/lib/catalogRequests', () => ({ CARD_COLUMNS: 'id', fetchCatalogPage: state.page, fetchCategoryKeys: state.categories }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
import { useProducts } from './useProducts';
let client: QueryClient;
function Wrapper({ children }: { children: ReactNode }) { return <QueryClientProvider client={client}>{children}</QueryClientProvider>; }
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); state.user = 'dealer-a'; state.tier = 'dealer'; state.categories.mockClear();
  state.page.mockReset().mockImplementation(async () => ({ rows: [{ id: 'one', sku: 'A', name_ar: 'راوتر', name_en: 'Router', brand: 'MikroTik', category_id: 'category', price_iqd: 100, price_dealer_iqd: state.user === 'dealer-a' ? 70 : null, stock: 2 }], total: 1 }));
});
afterEach(() => { cleanup(); client.clear(); });
it('deduplicates concurrent consumers and reuses a fresh page when navigating back', async () => {
  const first = renderHook(() => useProducts({ limit: 8, featured: true }), { wrapper: Wrapper });
  const second = renderHook(() => useProducts({ limit: 8, featured: true }), { wrapper: Wrapper });
  await waitFor(() => expect(second.result.current.loading).toBe(false));
  expect(state.page).toHaveBeenCalledTimes(1); expect(state.categories).toHaveBeenCalledTimes(1);
  first.unmount(); second.unmount();
  const back = renderHook(() => useProducts({ limit: 8, featured: true }), { wrapper: Wrapper });
  await waitFor(() => expect(back.result.current.products).toHaveLength(1)); expect(state.page).toHaveBeenCalledTimes(1);
});
it('never reuses dealer prices after switching accounts or signing out', async () => {
  const view = renderHook(() => useProducts({ limit: 8 }), { wrapper: Wrapper });
  await waitFor(() => expect(view.result.current.products[0]?.priceDealerIqd).toBe(70));
  state.user = 'retail-b'; state.tier = 'retail'; view.rerender();
  expect(view.result.current.products).toEqual([]);
  await waitFor(() => expect(view.result.current.loading).toBe(false));
  expect(view.result.current.products[0]?.priceDealerIqd).toBeNull();
  state.user = ''; view.rerender(); expect(view.result.current.products).toEqual([]);
  await waitFor(() => expect(view.result.current.loading).toBe(false)); expect(state.page).toHaveBeenCalledTimes(3);
});
