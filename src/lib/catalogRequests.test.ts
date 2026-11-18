import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ calls: [] as { columns: string; range?: number[]; ids?: unknown[] }[], fail: false }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => {
  const call = { columns: '', range: undefined as number[] | undefined, ids: undefined as unknown[] | undefined };
  const predicates: ((row: Record<string, unknown>) => boolean)[] = [];
  const orders: { key: string; ascending: boolean }[] = [];
  const builder = {
    select(columns: string) { call.columns = columns; state.calls.push(call); return builder; },
    eq(key: string, value: unknown) { predicates.push(row => row[key] === value); return builder; },
    neq(key: string, value: unknown) { predicates.push(row => row[key] !== value); return builder; },
    gt(key: string, value: number) { predicates.push(row => Number(row[key]) > value); return builder; },
    lte(key: string, value: number) { predicates.push(row => Number(row[key]) <= value); return builder; },
    gte(key: string, value: number) { predicates.push(row => Number(row[key]) >= value); return builder; },
    in(key: string, ids: unknown[]) { call.ids = ids; predicates.push(row => ids.includes(row[key])); return builder; },
    order(key: string, options = { ascending: true }) { orders.push({ key, ascending: options.ascending ?? true }); return builder; },
    range(from: number, to: number) { call.range = [from, to]; return builder; },
    then(resolve: (data: unknown) => unknown) {
      if (state.fail) return Promise.resolve(resolve({ data: null, error: { message: 'quota restricted' }, count: null }));
      const rows = Array.from({ length: 350 }, (_, i) => ({ id: String(i).padStart(4, '0'), price_iqd: (i + 1) * 1000,
        stock: i % 3 === 0 ? 0 : 4, brand: i % 2 ? 'Must' : 'MikroTik', category_id: 'network-id', created_at: String(i).padStart(4, '0') }))
        .filter(row => predicates.every(predicate => predicate(row)))
        .sort((a, b) => { for (const order of orders) { const x = a[order.key as keyof typeof a], y = b[order.key as keyof typeof b]; if (x !== y) return (x < y ? -1 : 1) * (order.ascending ? 1 : -1); } return 0; });
      const page = call.range ? rows.slice(call.range[0], call.range[1] + 1) : rows;
      return Promise.resolve(resolve({ data: page, error: null, count: rows.length }));
    },
  };
  return builder;
} } }));
import { CARD_COLUMNS, fetchCatalogPage } from './catalogRequests';
beforeEach(() => { state.calls = []; state.fail = false; });
describe('bounded storefront transfer', () => {
  it('fetches exactly page 2 from the server with global totals and deterministic newest ordering', async () => {
    const result = await fetchCatalogPage({}, 2);
    expect(result.rows).toHaveLength(24); expect(result.total).toBe(350);
    expect(result.rows[0].id).toBe('0325'); expect(result.rows[23].id).toBe('0302');
    expect(state.calls).toEqual([{ columns: CARD_COLUMNS, range: [24, 47], ids: undefined }]);
    expect(CARD_COLUMNS).not.toMatch(/desc_|datasheet/);
  });
  it('applies brand, stock and price bounds before paginating, including the featured limit of eight', async () => {
    const result = await fetchCatalogPage({ brand: 'Must', featured: true, minimum: 30_000, maximum: 200_000 }, 1, 8);
    expect(result.total).toBeGreaterThan(8); expect(result.rows).toHaveLength(8);
    expect(result.rows.every(row => row.brand === 'Must' && row.stock > 0 && Number(row.price_iqd) >= 30_000 && Number(row.price_iqd) <= 200_000)).toBe(true);
    expect(state.calls[0].range).toEqual([0, 7]);
  });
  it('preserves cross-page Arabic/spec match sorting while bounding IN URLs and fetching only 24 final cards', async () => {
    const result = await fetchCatalogPage({ ids: Array.from({ length: 350 }, (_, i) => String(i).padStart(4, '0')), sort: 'price_low' }, 3);
    expect(result.total).toBe(350); expect(result.rows.map(row => row.id)).toEqual(Array.from({ length: 24 }, (_, i) => String(i + 48).padStart(4, '0')));
    expect(state.calls.filter(call => call.columns === CARD_COLUMNS)).toHaveLength(1);
    expect(state.calls.at(-1)?.ids).toHaveLength(24);
    expect(state.calls.every(call => (call.ids?.length ?? 0) <= 100)).toBe(true);
  });
  it('does not download a catalogue for empty comparison or quote selections', async () => {
    expect(await fetchCatalogPage({ ids: [] })).toEqual({ rows: [], total: 0 }); expect(state.calls).toHaveLength(0);
  });
  it('surfaces service failures rather than caching a false empty success', async () => {
    state.fail = true; await expect(fetchCatalogPage({})).rejects.toMatchObject({ message: 'quota restricted' });
  });
});
