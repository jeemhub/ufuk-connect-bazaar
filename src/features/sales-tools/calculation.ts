import { normalizeLatinDigits } from "@/lib/digits";
export const BASE_EXCHANGE_RATE = 1500;
export function parseAmount(value: string): number | null {
  const text = normalizeLatinDigits(value).trim().replace(/,/g, "");
  if (!/^\d+(?:\.\d{1,4})?$/.test(text)) return null;
  const amount = Number(text);
  return Number.isFinite(amount) && amount <= 1_000_000_000_000 ? amount : null;
}
export function calculateParallelPrice(productPrice: number | null, rate: number | null) {
  if (productPrice === null || rate === null || !Number.isFinite(productPrice) || !Number.isFinite(rate)
    || productPrice < 0 || productPrice > 1_000_000_000_000 || rate <= 0 || rate > 100000) return null;
  return { dollars: productPrice / BASE_EXCHANGE_RATE, dinars: productPrice * rate / BASE_EXCHANGE_RATE };
}
export const formatAmount = (value: number) => new Intl.NumberFormat("en-US", {maximumFractionDigits: 4}).format(value);
