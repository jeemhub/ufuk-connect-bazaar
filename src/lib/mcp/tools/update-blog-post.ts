import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { assertHasChanges, compact, jsonResult, notFound, requireAdmin } from "../admin";
import { BLOG_COLUMNS, blogFields, slugField, toBlogPost } from "../content";

export default defineTool({
  name: "update_blog_post",
  title: "Update blog post",
  description:
    "Admin only. Update a blog post. Only the fields provided are changed. Setting status to 'published' publishes it (and notifies subscribed users); 'draft' unpublishes it.",
  inputSchema: {
    id: z.string().uuid().describe("Blog post id."),
    slug: slugField.optional(),
    title_ar: blogFields.title_ar.optional(),
    title_en: blogFields.title_en.optional(),
    excerpt_ar: blogFields.excerpt_ar,
    excerpt_en: blogFields.excerpt_en,
    body_ar: blogFields.body_ar,
    body_en: blogFields.body_en,
    cover_url: blogFields.cover_url,
    is_featured: blogFields.is_featured,
    featured_sort: blogFields.featured_sort,
    status: z.enum(["draft", "published"]).optional().describe("draft or published."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ id, status, ...fields }, ctx) => {
    const { supabase } = await requireAdmin(ctx);
    const patch: Record<string, unknown> = compact(fields);
    if (status !== undefined) {
      const { data: current, error } = await supabase.from("blog_posts").select("published_at").eq("id", id).maybeSingle();
      if (error) throw new ToolError(error.message);
      if (!current) notFound("blog post", id);
      // Mirrors the admin Blog page: keep the original publish date, clear it when unpublishing.
      patch.status = status;
      patch.published_at = status === "published" ? (current.published_at ?? new Date().toISOString()) : null;
    }
    assertHasChanges(patch);
    const { data, error } = await supabase.from("blog_posts").update(patch).eq("id", id).select(BLOG_COLUMNS).maybeSingle();
    if (error) throw new ToolError(error.message);
    if (!data) notFound("blog post", id);
    const post = toBlogPost(data);
    return jsonResult(`Blog post updated (${post.id}, ${post.status}).`, { post });
  },
});
