import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { compact, jsonResult, requireAdmin } from "../admin";
import { BLOG_COLUMNS, blogFields, slugField, toBlogPost } from "../content";

export default defineTool({
  name: "create_blog_post",
  title: "Create blog post",
  description:
    "Admin only. Create a blog post. Saved as a draft unless status is 'published' (publishing notifies subscribed users).",
  inputSchema: {
    slug: slugField,
    ...blogFields,
    status: z.enum(["draft", "published"]).optional().describe("Defaults to draft."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ status, ...fields }, ctx) => {
    const { supabase, userId } = await requireAdmin(ctx);
    const finalStatus = status ?? "draft";
    const { data, error } = await supabase
      .from("blog_posts")
      .insert({
        ...compact(fields),
        status: finalStatus,
        author_id: userId,
        published_at: finalStatus === "published" ? new Date().toISOString() : null,
      })
      .select(BLOG_COLUMNS)
      .single();
    if (error) throw new ToolError(error.message);
    const post = toBlogPost(data);
    return jsonResult(`Blog post created as ${post.status} (${post.id}).`, { post });
  },
});
