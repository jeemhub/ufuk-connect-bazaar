import { ToolError, type ToolContext } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "./supabase";

/**
 * Gate for every write tool: verifies the caller is signed in and holds the
 * `admin` role (via the project's `has_role` function) before any write runs.
 * Returns a Supabase client bound to the caller's own token, so RLS still applies.
 */
export async function requireAdmin(ctx: ToolContext) {
  if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
  const userId = ctx.getUserId();
  if (!userId) throw new ToolError("Admin role required");
  const supabase = supabaseForUser(ctx);
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new ToolError(`Could not verify admin role: ${error.message}`);
  if (data !== true) throw new ToolError("Admin role required");
  return { supabase, userId };
}

/** Drops keys whose value is `undefined`, so updates only touch the fields provided. */
export function compact<T extends Record<string, unknown>>(input: T): Partial<T> {
  return Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined)) as Partial<T>;
}

export function assertHasChanges(patch: Record<string, unknown>) {
  if (Object.keys(patch).length === 0) throw new ToolError("Provide at least one field to update");
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function jsonResult<T extends Record<string, unknown>>(summary: string, structured: T) {
  return {
    content: [{ type: "text" as const, text: `${summary}\n${JSON.stringify(structured, null, 2)}` }],
    structuredContent: structured,
  };
}

export function notFound(kind: string, id: string): never {
  throw new ToolError(`No ${kind} found with id ${id}`);
}
