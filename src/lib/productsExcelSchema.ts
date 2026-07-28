// Fixed, non-localized column contract for the products Excel import/export.
// Keep this in sync with supabase/functions/import-products/index.ts
// (EXPECTED_HEADER) - the edge function is the authoritative validator, this
// copy is only for fast client-side feedback before uploading.
export const PRODUCTS_EXCEL_HEADER = [
  "id",
  "name_ar",
  "name_en",
  "data_name",
  "description_ar",
  "description_en",
  "category",
  "brand",
  "price_single",
  "price_wholesale",
  "price_agency",
  "stock",
] as const;

export type ProductsExcelRow = Record<(typeof PRODUCTS_EXCEL_HEADER)[number], string | number | null>;
