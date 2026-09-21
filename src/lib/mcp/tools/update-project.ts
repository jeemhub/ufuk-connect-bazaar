import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { assertHasChanges, compact, jsonResult, notFound, requireAdmin } from "../admin";
import { PROJECT_COLUMNS, projectFields, slugField, toProject } from "../content";

export default defineTool({
  name: "update_project",
  title: "Update project",
  description: "Admin only. Update a portfolio project. Only the fields provided are changed.",
  inputSchema: {
    id: z.string().uuid().describe("Project id."),
    slug: slugField.optional(),
    ...projectFields,
    title_ar: projectFields.title_ar.optional(),
    title_en: projectFields.title_en.optional(),
    is_published: z.boolean().optional().describe("Show (true) or hide (false) on the website."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ id, ...fields }, ctx) => {
    const { supabase } = await requireAdmin(ctx);
    const patch = compact(fields);
    assertHasChanges(patch);
    const { data, error } = await supabase.from("projects").update(patch).eq("id", id).select(PROJECT_COLUMNS).maybeSingle();
    if (error) throw new ToolError(error.message);
    if (!data) notFound("project", id);
    const project = toProject(data);
    return jsonResult(`Project updated (${project.id}).`, { project });
  },
});
