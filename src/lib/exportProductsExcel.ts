import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCTS_EXCEL_HEADER } from "@/lib/productsExcelSchema";

const PAGE_SIZE = 1000;

interface ProductExportRow {
  id: string;
  name_ar: string | null;
  name_en: string | null;
  name_data: string | null;
  desc_ar: string | null;
  desc_en: string | null;
  category_id: string | null;
  brand: string | null;
  price_iqd: number | null;
  price_wholesale_iqd: number | null;
  price_dealer_iqd: number | null;
  stock: number | null;
}

// PostgREST caps a single request at 1000 rows by default, so this pages
// through with .range() to guarantee every product is exported regardless
// of how large the catalog grows.
async function fetchAllProducts(): Promise<ProductExportRow[]> {
  const all: ProductExportRow[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("products")
      .select(
        "id,name_ar,name_en,name_data,desc_ar,desc_en,category_id,brand,price_iqd,price_wholesale_iqd,price_dealer_iqd,stock"
      )
      .order("created_at", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    const page = (data ?? []) as ProductExportRow[];
    all.push(...page);
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return all;
}

function cell(v: unknown): string | number {
  if (v === null || v === undefined) return "";
  return v as string | number;
}

export async function exportProductsToExcel(): Promise<number> {
  const [products, { data: categories, error: catErr }] = await Promise.all([
    fetchAllProducts(),
    supabase.from("categories").select("id,key"),
  ]);
  if (catErr) throw catErr;

  const categoryKeyById = new Map<string, string>();
  for (const c of (categories ?? []) as { id: string; key: string }[]) {
    categoryKeyById.set(c.id, c.key);
  }

  const sheetRows = products.map((p) => ({
    id: p.id,
    name_ar: cell(p.name_ar),
    name_en: cell(p.name_en),
    data_name: cell(p.name_data),
    description_ar: cell(p.desc_ar),
    description_en: cell(p.desc_en),
    category: cell(p.category_id ? categoryKeyById.get(p.category_id) : null),
    brand: cell(p.brand),
    price_single: cell(p.price_iqd),
    price_wholesale: cell(p.price_wholesale_iqd),
    price_agency: cell(p.price_dealer_iqd),
    stock: cell(p.stock),
  }));

  const ws = XLSX.utils.json_to_sheet(sheetRows, { header: [...PRODUCTS_EXCEL_HEADER] });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Products");
  const fileName = `products-${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);

  return sheetRows.length;
}
