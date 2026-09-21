import { z } from "zod";

const iqd = z.number().int().min(0);
const text = z.string().trim();

/** Editable product columns, shared by create_product and update_product. All optional here. */
export const productFields = {
  name_en: text.min(1).optional().describe("English name. Defaults to name_ar on create."),
  name_data: text.nullable().optional().describe("Internal/data name used by stock imports, or null."),
  desc_ar: text.nullable().optional().describe("Arabic description, or null."),
  desc_en: text.nullable().optional().describe("English description, or null."),
  sku: text.nullable().optional().describe("SKU, or null."),
  brand: text.nullable().optional().describe("Brand name (as in list_catalog_taxonomy), or null."),
  category_id: z.string().uuid().nullable().optional().describe("Category id, or null."),
  subcategory: text.nullable().optional().describe("Subcategory name(s), comma-separated, or null."),
  price_iqd: iqd.optional().describe("Retail price in IQD (>= 0)."),
  price_wholesale_iqd: iqd.optional().describe("Wholesale price in IQD (>= 0)."),
  price_dealer_iqd: iqd.optional().describe("Dealer price in IQD (>= 0)."),
  stock: z.number().int().min(0).optional().describe("Units in stock (>= 0)."),
  image_url: z.string().url().nullable().optional().describe("Image URL, or null."),
  datasheet_url: z.string().url().nullable().optional().describe("Datasheet URL, or null."),
  datasheet_name: text.nullable().optional().describe("Datasheet display name, or null."),
};

export const PRODUCT_COLUMNS =
  "id, sku, name_ar, name_en, name_data, desc_ar, desc_en, brand, category_id, subcategory, price_iqd, price_wholesale_iqd, price_dealer_iqd, stock, is_active, image_url, datasheet_url, datasheet_name, created_at, updated_at";

type ProductRow = {
  id: string;
  sku: string | null;
  name_ar: string;
  name_en: string;
  name_data: string | null;
  desc_ar: string | null;
  desc_en: string | null;
  brand: string | null;
  category_id: string | null;
  subcategory: string | null;
  price_iqd: number;
  price_wholesale_iqd: number;
  price_dealer_iqd: number;
  stock: number;
  is_active: boolean;
  image_url: string | null;
  datasheet_url: string | null;
  datasheet_name: string | null;
  created_at: string;
  updated_at: string;
};

export function toProduct(p: ProductRow) {
  return {
    id: p.id,
    sku: p.sku ?? null,
    nameAr: p.name_ar,
    nameEn: p.name_en,
    nameData: p.name_data ?? null,
    descAr: p.desc_ar ?? null,
    descEn: p.desc_en ?? null,
    brand: p.brand ?? null,
    categoryId: p.category_id ?? null,
    subcategory: p.subcategory ?? null,
    priceIqd: p.price_iqd,
    priceWholesaleIqd: p.price_wholesale_iqd,
    priceDealerIqd: p.price_dealer_iqd,
    stock: p.stock,
    isActive: p.is_active,
    imageUrl: p.image_url ?? null,
    datasheetUrl: p.datasheet_url ?? null,
    datasheetName: p.datasheet_name ?? null,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}
