import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_order",
  title: "Get order with items",
  description: "Fetch one order the signed-in user may see, including its line items.",
  inputSchema: { id: z.string().uuid().describe("Order id.") },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ id }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
    if (error) throw new ToolError(error.message);
    if (!data) throw new ToolError(`No order visible with id ${id}`);
    const { data: items, error: itemsError } = await supabase.from("order_items").select("*").eq("order_id", id);
    if (itemsError) throw new ToolError(itemsError.message);

    const order = {
      id: data.id,
      orderNo: data.order_no,
      status: data.status,
      totalIqd: data.total_iqd,
      customerName: data.customer_name,
      customerPhone: data.customer_phone,
      customerCity: data.customer_city ?? null,
      customerAddress: data.customer_address ?? null,
      notes: data.notes ?? null,
      createdAt: data.created_at,
      items: (items ?? []).map((i) => {
        const row = i as Record<string, unknown>;
        return {
          id: String(row.id),
          productId: row.product_id == null ? null : String(row.product_id),
          name: row.name_en == null ? (row.name_ar == null ? null : String(row.name_ar)) : String(row.name_en),
          quantity: Number(row.qty ?? row.quantity ?? 0),
          unitPriceIqd: Number(row.unit_price_iqd ?? row.price_iqd ?? 0),
        };
      }),
    };
    return {
      content: [{ type: "text", text: JSON.stringify(order, null, 2) }],
      structuredContent: { order },
    };
  },
});
