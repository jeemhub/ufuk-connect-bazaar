import { describe, expect, it } from "vitest";
import { calculateUps, normalizePhone, validIraqiPhone, applicablePrice } from "./catalog";
import type { Product } from "@/data/mockData";

describe("commerce calculations and customer input", () => {
  it.each(["٠٧٧١٦٩٩٢٩٥٥", "+964 771 699 2955", "00964 7716992955", "۰۷۷۱۶۹۹۲۹۵۵"])("accepts Iraqi mobile formats: %s", value => {
    expect(normalizePhone(value)).toBe("07716992955");
    expect(validIraqiPhone(value)).toBe(true);
  });
  it.each(["123456", "+971551234567", "077169929550"])("rejects invalid mobile: %s", value => expect(validIraqiPhone(value)).toBe(false));
  it("adds capacity headroom and accounts for conversion and usable battery energy", () => {
    expect(calculateUps(800, 2, 0.8, 0.5)).toEqual({minimumWatts:1000, minimumVa:1250, batteryWh:4000});
  });
  it.each([[0,2], [100,-1], [NaN,1], [Infinity,1], [100,1,1.01], [100,1,0.8,0]])("rejects impossible UPS inputs %j", (...values) => {
    expect(calculateUps(values[0],values[1],values[2],values[3])).toBeNull();
  });
  it.each(["retail", "wholesale", "dealer"])("masks stale prices for an unstable brand for %s", tier => {
    expect(applicablePrice({priceUnstable:true,priceIqd:10000,priceWholesaleIqd:8000,priceDealerIqd:7000} as Product,tier)).toBe(0);
  });
  it("uses eligible prices with retail fallback, including products needing a quote", () => {
    const product = {priceIqd:10000,priceDealerIqd:7000,priceWholesaleIqd:8000} as Product;
    expect(applicablePrice(product,"retail")).toBe(10000);
    expect(applicablePrice(product,"dealer")).toBe(7000);
    expect(applicablePrice({...product,priceDealerIqd:0},"dealer")).toBe(10000);
    expect(applicablePrice({...product,priceIqd:0},"retail")).toBe(0);
  });
});
