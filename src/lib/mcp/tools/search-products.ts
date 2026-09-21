import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_products",
  title: "Search products",
  description:
    "Search the store catalog by name (Arabic, English, or data name), SKU or brand. Prices shown follow the signed-in user's pricing tier.",
  inputSchema: {
    query: z.string().trim().nullable().describe("Free text to match against product names, SKU or brand. Null lists recent products."),
    brand: z.string().trim().nullable().describe("Exact brand name filter, or null."),
    in_stock_only: z.boolean().nullable().describe("When true, only products with stock above zero."),
    limit: z.number().int().min(1).max(100).nullable().describe("Maximum rows to return (default 25)."),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ query, brand, in_stock_only, limit }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const supabase = supabaseForUser(ctx);
    let q = supabase
      .from("products")
      .select("id, sku, name_ar, name_en, name_data, brand, subcategory, price_iqd, price_wholesale_iqd, price_dealer_iqd, stock, is_active, image_url")
      .eq("is_active", true)
      .limit(limit ?? 25);

    if (query) {
      const like = `%${query}%`;
      q = q.or(`name_ar.ilike.${like},name_en.ilike.${like},name_data.ilike.${like},sku.ilike.${like},brand.ilike.${like}`);
    }
    if (brand) q = q.eq("brand", brand);
    if (in_stock_only) q = q.gt("stock", 0);

    const { data, error } = await q;
    if (error) throw new ToolError(error.message);
    const products = (data ?? []).map((p) => ({
      id: p.id,
      sku: p.sku ?? null,
      nameAr: p.name_ar,
      nameEn: p.name_en,
      nameData: p.name_data ?? null,
      brand: p.brand ?? null,
      subcategory: p.subcategory ?? null,
      priceIqd: p.price_iqd,
      priceWholesaleIqd: p.price_wholesale_iqd,
      priceDealerIqd: p.price_dealer_iqd,
      stock: p.stock,
      imageUrl: p.image_url ?? null,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(products, null, 2) }],
      structuredContent: { products },
    };
  },
});
