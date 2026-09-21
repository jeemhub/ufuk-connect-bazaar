import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { jsonResult, notFound, requireAdmin } from "../admin";

export default defineTool({
  name: "delete_product",
  title: "Delete product",
  description:
    "Admin only. Permanently delete a product. Refused if the product appears in any order; use set_product_active with is_active=false to hide it instead.",
  inputSchema: { id: z.string().uuid().describe("Product id.") },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id }, ctx) => {
    const { supabase } = await requireAdmin(ctx);
    const { count, error: countError } = await supabase
      .from("order_items")
      .select("id", { count: "exact", head: true })
      .eq("product_id", id);
    if (countError) throw new ToolError(countError.message);
    if ((count ?? 0) > 0) {
      throw new ToolError(
        `Product appears in ${count} order item(s) and cannot be deleted. Use set_product_active with is_active=false to hide it instead.`,
      );
    }
    const { data, error } = await supabase.from("products").delete().eq("id", id).select("id, name_ar, name_en").maybeSingle();
    if (error) throw new ToolError(error.message);
    if (!data) notFound("product", id);
    const deleted = { id: data.id, nameAr: data.name_ar, nameEn: data.name_en };
    return jsonResult(`Product deleted (${deleted.id}).`, { deleted });
  },
});
