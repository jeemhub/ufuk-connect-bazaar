import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ page: vi.fn(), error: null as string | null }));
vi.mock('@/hooks/useProducts', () => ({
  useCatalogIndex: () => ({ isPending: false, error: null, data: [{ id: 'inverter', name_ar: 'عاكس 5kW', name_en: 'Inverter', brand: 'Must', category_id: 'solar-id' }, { id: 'router', name_ar: 'راوتر 8 منافذ', name_en: 'Router', brand: 'MikroTik', category_id: 'net-id' }] }),
  useCategoryKeys: () => ({ isPending: false, error: null, data: { 'solar-id': 'solar', 'net-id': 'networking' } }),
  dbToProduct: (row: Record<string, string>, category: string) => ({ id: row.id, nameAr: row.name_ar, nameEn: row.name_en, brand: row.brand, category, subcategory: '', sku: '' }),
  useCatalogPage: (...args: unknown[]) => { state.page(...args); return { products: [{ id: 'card' }], total: 50, loading: false, error: state.error }; },
}));
vi.mock('@/hooks/useBrands', () => ({ useBrands: () => ({ brands: [] }) }));
vi.mock('@/hooks/useCommerceSettings', () => ({ useProductDetails: () => ({ data: {}, isPending: false, error: null }) }));
vi.mock('@/i18n/LanguageContext', () => ({ useLanguage: () => ({ lang: 'ar', t: (key: string) => key }) }));
vi.mock('@/components/site/ProductCard', () => ({ ProductCard: () => <article>Product card</article> }));
vi.mock('@/components/seo/Seo', () => ({ Seo: () => null, SITE_NAME: 'UFUK' }));
import ProductsPage from './ProductsPage';
beforeEach(() => { vi.spyOn(window, 'scrollTo').mockImplementation(() => {}); state.page.mockClear(); state.error = null; }); afterEach(() => { cleanup(); vi.restoreAllMocks(); });
it('requests the next page and resets server pagination when category changes', async () => {
  render(<MemoryRouter><ProductsPage /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: 'التالي' }));
  await waitFor(() => expect(state.page.mock.lastCall?.[1]).toBe(2));
  fireEvent.click(screen.getByRole('button', { name: 'الشبكات' }));
  await waitFor(() => expect(state.page.mock.lastCall?.[0]).toMatchObject({ categoryId: 'net-id' }));
  expect(state.page.mock.lastCall?.[1]).toBe(1);
});
it('preserves Arabic synonym matches using only the lightweight name index', async () => {
  render(<MemoryRouter><ProductsPage /></MemoryRouter>);
  fireEvent.change(screen.getByRole('textbox', { name: 'البحث في المنتجات' }), { target: { value: 'انفرتر' } });
  await waitFor(() => expect(state.page.mock.lastCall?.[0]).toMatchObject({ ids: ['inverter'] }));
});
it('does not silently show all categories for an invalid category URL', () => {
  render(<MemoryRouter initialEntries={['/products?category=does-not-exist']}><ProductsPage /></MemoryRouter>);
  expect(state.page.mock.lastCall?.[0]).toMatchObject({ ids: [] });
});
it('shows the actual unavailable state when the database is restricted', () => {
  state.error = 'quota restricted'; render(<MemoryRouter><ProductsPage /></MemoryRouter>);
  expect(screen.getByRole('alert')).toHaveTextContent('تعذر تحميل المنتجات');
  expect(screen.queryByText('Product card')).not.toBeInTheDocument();
});
