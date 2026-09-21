import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_orders",
  title: "List my orders",
  description: "List the orders visible to the signed-in user, newest first, with optional status filter.",
  inputSchema: {
    status: z.string().trim().nullable().describe("Order status filter (e.g. pending, confirmed), or null for all."),
    limit: z.number().int().min(1).max(100).nullable().describe("Maximum orders to return (default 20)."),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const supabase = supabaseForUser(ctx);
    let q = supabase
      .from("orders")
      .select("id, order_no, status, total_iqd, customer_name, customer_phone, customer_city, created_at")
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) throw new ToolError(error.message);
    const orders = (data ?? []).map((o) => ({
      id: o.id,
      orderNo: o.order_no,
      status: o.status,
      totalIqd: o.total_iqd,
      customerName: o.customer_name,
      customerPhone: o.customer_phone,
      customerCity: o.customer_city ?? null,
      createdAt: o.created_at,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(orders, null, 2) }],
      structuredContent: { orders },
    };
  },
});
