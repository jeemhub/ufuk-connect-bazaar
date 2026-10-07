import type { Product } from "@/data/mockData";
import { normalizeLatinDigits } from "./digits";

export function cleanProductName(name: string) {
  return name.replace(/^\s*(?:الاسم بالعربي|الاسم باللغة العربية)\s*:\s*/, "")
    .replace(/ٍ/g, "").replace(/انتنرنت/g, "إنترنت").replace(/هيكسفيجن/g, "هيكفيجن")
    .replace(/\bLOGITCH\b/gi, "LOGITECH").replace(/\bPURPLT\b/gi, "PURPLE")
    .replace(/\s+/g, " ").trim();
}

export function productName(p: Product, lang: string) {
  return cleanProductName((lang === "ar" ? p.nameAr : p.nameEn) || p.nameData || p.nameAr);
}

export function applicablePrice(p: Product, tier: string) {
  if (p.priceUnstable) return 0;
  return tier === "dealer" && p.priceDealerIqd ? p.priceDealerIqd
    : tier === "wholesale" && p.priceWholesaleIqd ? p.priceWholesaleIqd : p.priceIqd;
}

export function normalizePhone(value: string) {
  const phone = normalizeLatinDigits(value).replace(/[^0-9]/g, "");
  return phone.startsWith("00964") ? "0" + phone.slice(5)
    : phone.startsWith("964") ? "0" + phone.slice(3) : phone;
}
export const validIraqiPhone = (value: string) => /^07\d{9}$/.test(normalizePhone(value));

// Extract only values explicitly present in the product title/SKU. These are not verified datasheet specifications.
export function titleSpecs(p: Product): Record<string, string> {
  const text = normalizeLatinDigits([p.nameAr, p.nameEn, p.sku].join(" "));
  const specs: Record<string, string> = {};
  const ports = text.match(/(?:\b(\d+)\s*[- ]?ports?\b|(\d+)\s*(?:منفذ|منافذ|بورت))/i);
  if (ports) specs.ports = ports[1] || ports[2];
  if (/\bpoe\+?\b/i.test(text)) specs.poe = "PoE";
  const watts = text.match(/(\d+(?:\.\d+)?)\s*(k\s?w|كيلو\s*واط|واط|\bW\b|kVA)/i);
  if (watts) specs.power = watts[0];
  const battery = text.match(/(\d+(?:\.\d+)?)\s*(?:Ah\b|أمبير|امبير)/i);
  if (battery) specs.capacity = battery[0];
  const wifi = text.match(/Wi[ -]?Fi\s*([567])/i) || text.match(/واي\s*فاي\s*([567])/);
  if (wifi) specs.wifi = `Wi-Fi ${wifi[1]}`;
  return specs;
}

export function descriptionBlocks(text: string) {
  return text.replace(/(?:المميزات الرئيسية|المواصفات الفنية|Key features|Specifications)\s*:/gi, "\n\n$&\n")
    .split(/\n+|(?<=[.!؟])\s+(?=[\p{L}])/u).map(s => s.trim()).filter(Boolean);
}

export function calculateUps(loadWatts: number, hours: number, efficiency = 0.85, usable = 0.8) {
  if (![loadWatts, hours, efficiency, usable].every(n => Number.isFinite(n) && n > 0) || efficiency > 1 || usable > 1) return null;
  return { minimumWatts: Math.ceil(loadWatts * 1.25), minimumVa: Math.ceil(loadWatts * 1.25 / 0.8), batteryWh: Math.ceil(loadWatts * hours / (efficiency * usable)) };
}

export const unstablePriceMessage = (lang: string) => lang === "ar"
  ? "السعر غير مستقر — يجب التواصل مع الشركة"
  : "Price is unstable — please contact the company";
