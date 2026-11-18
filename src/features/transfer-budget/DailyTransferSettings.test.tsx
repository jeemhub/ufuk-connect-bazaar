import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
vi.mock('@/auth/AuthProvider', () => ({ useAuth: () => ({ user: { id: 'admin-test' } }) }));
vi.mock('@/i18n/LanguageContext', () => ({ useLanguage: () => ({ lang: 'ar' }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { getSession: async () => ({ data: { session: { access_token: 'TEST_ONLY_TOKEN' } } }) } } }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
import { DailyTransferSettings } from './DailyTransferSettings';
let client: QueryClient;
function Wrapper({ children }: { children: ReactNode }) { return <QueryClientProvider client={client}>{children}</QueryClientProvider>; }
beforeEach(() => { client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); });
afterEach(() => { cleanup(); client.clear(); vi.unstubAllGlobals(); });
it('shows the shared warning and sends an authenticated global limit change', async () => {
  const fetcher = vi.fn(async (_input: string, options: RequestInit) => Response.json({ configured: true, enabled: true, usedBytes: 100_000_000, limitBytes: options.method === 'PATCH' ? 110_000_000 : 120_000_000, requests: 25, blockedImages: 0 }));
  vi.stubGlobal('fetch', fetcher); render(<DailyTransferSettings />, { wrapper: Wrapper });
  await screen.findByText('100.00 / 120 MB'); expect(screen.getByText(/اقترب من الحد اليومي/)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('الحد اليومي بالميغابايت MB'), { target: { value: '110' } });
  fireEvent.click(screen.getByRole('button', { name: /^حفظ$/ }));
  await screen.findByText('100.00 / 110 MB');
  const patch = fetcher.mock.calls.find(([, options]) => options.method === 'PATCH')!;
  expect(JSON.parse(patch[1].body as string)).toEqual({ enabled: true, limitMb: 110 });
  expect(patch[1].headers).toMatchObject({ Authorization: 'Bearer TEST_ONLY_TOKEN' });
});
it('reports an unavailable counter instead of invented usage when Supabase is restricted', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('restricted', { status: 503 })));
  render(<DailyTransferSettings />, { wrapper: Wrapper });
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('لا توجد قراءة مؤكدة'));
  expect(screen.queryByText('0.00 / 120 MB')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: /^حفظ$/ })).toBeDisabled();
});
