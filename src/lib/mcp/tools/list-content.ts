import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_content",
  title: "List blog posts or projects",
  description: "List published blog posts or completed projects from the website.",
  inputSchema: {
    kind: z.enum(["blog", "projects"]).describe("Which content to list."),
    limit: z.number().int().min(1).max(50).nullable().describe("Maximum rows (default 10)."),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ kind, limit }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const supabase = supabaseForUser(ctx);
    const take = limit ?? 10;

    if (kind === "projects") {
      const { data, error } = await supabase
        .from("projects")
        .select("id, slug, title_ar, title_en, summary_ar, summary_en, location, client, completed_at, is_published")
        .eq("is_published", true)
        .order("sort", { ascending: true })
        .limit(take);
      if (error) throw new ToolError(error.message);
      const items = (data ?? []).map((p) => ({
        id: p.id,
        slug: p.slug,
        titleAr: p.title_ar,
        titleEn: p.title_en,
        summaryAr: p.summary_ar ?? null,
        summaryEn: p.summary_en ?? null,
        location: p.location ?? null,
        client: p.client ?? null,
        completedAt: p.completed_at ?? null,
      }));
      return {
        content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
        structuredContent: { projects: items },
      };
    }

    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(take);
    if (error) throw new ToolError(error.message);
    const items = (data ?? []).map((row) => {
      const p = row as Record<string, unknown>;
      return {
        id: String(p.id),
        slug: p.slug == null ? null : String(p.slug),
        titleAr: p.title_ar == null ? null : String(p.title_ar),
        titleEn: p.title_en == null ? null : String(p.title_en),
        excerptAr: p.excerpt_ar == null ? null : String(p.excerpt_ar),
        excerptEn: p.excerpt_en == null ? null : String(p.excerpt_en),
        createdAt: p.created_at == null ? null : String(p.created_at),
      };
    });
    return {
      content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
      structuredContent: { posts: items },
    };
  },
});
