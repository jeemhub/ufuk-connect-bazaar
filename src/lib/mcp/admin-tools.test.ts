import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ToolContext } from "@lovable.dev/mcp-js";

type Call = { table: string; ops: [string, unknown[]][] };
type Result = { data?: unknown; error?: { message: string } | null; count?: number | null };

const state = vi.hoisted(() => ({
  isAdmin: true,
  calls: [] as { table: string; ops: [string, unknown[]][] }[],
  respond: (_call: { table: string; ops: [string, unknown[]][] }): Record<string, unknown> => ({ data: null }),
}));

vi.mock("./supabase", () => ({
  supabaseForUser: () => ({
    rpc: async (fn: string) => (fn === "has_role" ? { data: state.isAdmin, error: null } : { data: null, error: null }),
    from: (table: string) => {
      const call: Call = { table, ops: [] };
      state.calls.push(call);
      const builder: Record<string, unknown> = {};
      for (const op of ["select", "insert", "update", "delete", "eq", "or", "order", "limit", "gt"]) {
        builder[op] = (...args: unknown[]) => {
          call.ops.push([op, args]);
          return builder;
        };
      }
      const settle = () => Promise.resolve({ error: null, ...(state.respond(call) as Result) });
      builder.single = settle;
      builder.maybeSingle = settle;
      builder.then = (ok: (v: unknown) => unknown, fail: (e: unknown) => unknown) => settle().then(ok, fail);
      return builder;
    },
  }),
}));

import createProduct from "./tools/create-product";
import deleteProduct from "./tools/delete-product";
import updateProductStock from "./tools/update-product-stock";
import listCatalogTaxonomy from "./tools/list-catalog-taxonomy";

const ctx = {
  isAuthenticated: () => true,
  getUserId: () => "00000000-0000-0000-0000-000000000001",
  getToken: () => "token",
} as unknown as ToolContext;

const ID = "11111111-1111-1111-1111-111111111111";
const run = (tool: { handler: (...a: never[]) => unknown }, input: unknown) =>
  (tool.handler as (i: unknown, c: ToolContext) => Promise<unknown>)(input, ctx);
const writes = () => state.calls.filter((c) => c.ops.some(([op]) => ["insert", "update", "delete"].includes(op)));

beforeEach(() => {
  state.isAdmin = true;
  state.calls = [];
  state.respond = () => ({ data: null });
});

describe("admin write tools", () => {
  it("rejects non-admins before touching any table", async () => {
    state.isAdmin = false;
    await expect(run(createProduct, { name_ar: "test" })).rejects.toThrow("Admin role required");
    await expect(run(deleteProduct, { id: ID })).rejects.toThrow("Admin role required");
    expect(state.calls).toHaveLength(0);
  });

  it("creates products hidden by default", async () => {
    state.respond = (c) => ({ data: { id: ID, ...(c.ops.find(([op]) => op === "insert")![1][0] as object) } });
    await run(createProduct, { name_ar: "test" });
    const inserted = writes()[0].ops.find(([op]) => op === "insert")![1][0];
    expect(inserted).toMatchObject({ name_ar: "test", name_en: "test", is_active: false });
  });

  it("refuses a stock delta that would go below zero", async () => {
    state.respond = () => ({ data: { stock: 3 } });
    await expect(run(updateProductStock, { id: ID, delta: -5 })).rejects.toThrow("below 0");
    expect(writes()).toHaveLength(0);
  });

  it("requires exactly one of stock or delta", async () => {
    await expect(run(updateProductStock, { id: ID, stock: 1, delta: 1 })).rejects.toThrow("exactly one");
  });

  it("refuses to delete a product that appears in orders", async () => {
    state.respond = (c) => (c.table === "order_items" ? { count: 2 } : { data: { id: ID } });
    await expect(run(deleteProduct, { id: ID })).rejects.toThrow("set_product_active");
    expect(writes()).toHaveLength(0);
  });
});

describe("list_catalog_taxonomy", () => {
  it("selects the real categories columns (no slug)", async () => {
    state.respond = () => ({ data: [] });
    await run(listCatalogTaxonomy, {});
    const cats = state.calls.find((c) => c.table === "categories")!;
    const columns = String(cats.ops.find(([op]) => op === "select")![1][0]);
    expect(columns).not.toContain("slug");
    expect(columns).toContain("key");
  });
});
