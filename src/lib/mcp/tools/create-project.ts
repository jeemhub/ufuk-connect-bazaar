import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { compact, jsonResult, requireAdmin } from "../admin";
import { PROJECT_COLUMNS, projectFields, slugField, toProject } from "../content";

export default defineTool({
  name: "create_project",
  title: "Create project",
  description: "Admin only. Create a portfolio project. Unpublished unless is_published is true.",
  inputSchema: {
    slug: slugField,
    ...projectFields,
    is_published: z.boolean().optional().describe("Show on the website. Defaults to false."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    const { supabase, userId } = await requireAdmin(ctx);
    const { data, error } = await supabase
      .from("projects")
      .insert({ ...compact(input), is_published: input.is_published ?? false, author_id: userId })
      .select(PROJECT_COLUMNS)
      .single();
    if (error) throw new ToolError(error.message);
    const project = toProject(data);
    return jsonResult(`Project created (${project.id}).`, { project });
  },
});
