import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { jsonResult, requireAdmin, slugify } from "../admin";
import { BRAND_COLUMNS, toBrand } from "../brands";

export default defineTool({
  name: "create_brand",
  title: "Create brand",
  description: "Admin only. Create a brand.",
  inputSchema: {
    name: z.string().trim().min(1).describe("Brand name."),
    slug: z.string().trim().min(1).optional().describe("Unique URL slug. Defaults to a slug of name."),
    description: z.string().trim().nullable().optional().describe("Description, or null."),
    logo_url: z.string().url().nullable().optional().describe("Logo image URL, or null."),
    is_active: z.boolean().optional().describe("Show on the store. Defaults to true."),
    sort: z.number().int().min(0).optional().describe("Display order. Defaults to 0."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ name, slug, description, logo_url, is_active, sort }, ctx) => {
    const { supabase } = await requireAdmin(ctx);
    const finalSlug = slugify(slug ?? name);
    if (!finalSlug) throw new ToolError("Could not derive a slug from name; provide slug explicitly");
    const { data, error } = await supabase
      .from("brands")
      .insert({
        name,
        slug: finalSlug,
        description: description ?? null,
        logo_url: logo_url ?? null,
        is_active: is_active ?? true,
        sort: sort ?? 0,
      })
      .select(BRAND_COLUMNS)
      .single();
    if (error) throw new ToolError(error.message);
    const brand = toBrand(data);
    return jsonResult(`Brand created (${brand.id}).`, { brand });
  },
});
