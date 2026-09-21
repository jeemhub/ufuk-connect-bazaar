import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { jsonResult, notFound, requireAdmin } from "../admin";
import { PRODUCT_COLUMNS, toProduct } from "../products";

const MAX_ATTEMPTS = 3;

export default defineTool({
  name: "update_product_stock",
  title: "Update product stock",
  description:
    "Admin only. Set a product's stock to an absolute value (stock) or adjust it by a signed amount (delta). Provide exactly one. Stock can never go below 0.",
  inputSchema: {
    id: z.string().uuid().describe("Product id."),
    stock: z.number().int().min(0).optional().describe("New absolute stock (>= 0)."),
    delta: z.number().int().optional().describe("Amount to add (positive) or remove (negative)."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ id, stock, delta }, ctx) => {
    if ((stock === undefined) === (delta === undefined)) throw new ToolError("Provide exactly one of stock or delta");
    const { supabase } = await requireAdmin(ctx);

    if (stock !== undefined) {
      const { data, error } = await supabase.from("products").update({ stock }).eq("id", id).select(PRODUCT_COLUMNS).maybeSingle();
      if (error) throw new ToolError(error.message);
      if (!data) notFound("product", id);
      const product = toProduct(data);
      return jsonResult(`Stock set to ${product.stock}.`, { product });
    }

    // Compare-and-set on the current value so concurrent edits are not lost.
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const { data: current, error: readError } = await supabase.from("products").select("stock").eq("id", id).maybeSingle();
      if (readError) throw new ToolError(readError.message);
      if (!current) notFound("product", id);
      const next = current.stock + delta!;
      if (next < 0) throw new ToolError(`Stock cannot go below 0 (current ${current.stock}, delta ${delta})`);
      const { data, error } = await supabase
        .from("products")
        .update({ stock: next })
        .eq("id", id)
        .eq("stock", current.stock)
        .select(PRODUCT_COLUMNS)
        .maybeSingle();
      if (error) throw new ToolError(error.message);
      if (data) {
        const product = toProduct(data);
        return jsonResult(`Stock changed from ${current.stock} to ${product.stock}.`, { product });
      }
    }
    throw new ToolError("Stock changed concurrently; please retry");
  },
});
