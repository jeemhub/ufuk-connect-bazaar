import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { jsonResult, notFound, requireAdmin } from "../admin";
import { PRODUCT_COLUMNS, toProduct } from "../products";

export default defineTool({
  name: "set_product_active",
  title: "Show or hide product",
  description: "Admin only. Show (is_active=true) or hide (is_active=false) a product on the store.",
  inputSchema: {
    id: z.string().uuid().describe("Product id."),
    is_active: z.boolean().describe("true to show on the store, false to hide."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ id, is_active }, ctx) => {
    const { supabase } = await requireAdmin(ctx);
    const { data, error } = await supabase
      .from("products")
      .update({ is_active })
      .eq("id", id)
      .select(PRODUCT_COLUMNS)
      .maybeSingle();
    if (error) throw new ToolError(error.message);
    if (!data) notFound("product", id);
    const product = toProduct(data);
    return jsonResult(`Product ${is_active ? "shown" : "hidden"} (${product.id}).`, { product });
  },
});
