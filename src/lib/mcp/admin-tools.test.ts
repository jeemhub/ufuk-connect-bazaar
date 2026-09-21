import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ToolContext } from "@lovable.dev/mcp-js";

type Call = { table: string; ops: [string, unknown[]][] };
type Result = { data?: unknown; error?: { message: string } | null; count?: number | null };

const state = vi.hoisted(() => ({
  isAdmin: true,
  calls: [] as { table: string; ops: [string, unknown[]][] }[],
  uploads: [] as string[],
  removed: [] as string[],
  respond: (_call: { table: string; ops: [string, unknown[]][] }): Record<string, unknown> => ({ data: null }),
}));

vi.mock("./supabase", () => ({
  supabaseForUser: () => ({
    storage: {
      from: () => ({
        upload: async (path: string) => {
          state.uploads.push(path);
          return { error: null };
        },
        remove: async (paths: string[]) => {
          state.removed.push(...paths);
          return { error: null };
        },
        getPublicUrl: (path: string) => ({
          data: { publicUrl: `https://x.supabase.co/storage/v1/object/public/product-images/${path}` },
        }),
      }),
    },
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
import setProductDatasheet from "./tools/set-product-datasheet";

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
  state.uploads = [];
  state.removed = [];
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

describe("set_product_datasheet", () => {
  const pdf = btoa("%PDF-1.4 test");
  const OLD = "datasheets/old.pdf";
  const productRow = (c: Call) => {
    const update = c.ops.find(([op]) => op === "update");
    const patch = (update?.[1][0] ?? {}) as Record<string, unknown>;
    return {
      data: {
        id: ID,
        datasheet_url: `https://x.supabase.co/storage/v1/object/public/product-images/${OLD}`,
        ...patch,
      },
    };
  };

  it("uploads a base64 PDF, saves the public link, and removes the previous file", async () => {
    state.respond = productRow;
    const res = (await run(setProductDatasheet, { id: ID, pdf_base64: pdf, file_name: "spec.pdf" })) as {
      structuredContent: { product: { datasheetUrl: string; datasheetName: string } };
    };
    expect(state.uploads).toHaveLength(1);
    expect(state.uploads[0]).toMatch(/^datasheets\/.+\.pdf$/);
    expect(res.structuredContent.product.datasheetUrl).toContain(state.uploads[0]);
    expect(res.structuredContent.product.datasheetName).toBe("spec.pdf");
    expect(state.removed).toEqual([OLD]);
  });

  it("rejects files that are not PDFs without uploading", async () => {
    state.respond = productRow;
    await expect(run(setProductDatasheet, { id: ID, pdf_base64: btoa("hello") })).rejects.toThrow("not a PDF");
    expect(state.uploads).toHaveLength(0);
  });

  it("requires exactly one source", async () => {
    await expect(run(setProductDatasheet, { id: ID })).rejects.toThrow("exactly one");
    await expect(run(setProductDatasheet, { id: ID, pdf_base64: pdf, remove: true })).rejects.toThrow("exactly one");
  });

  it("remove clears the fields", async () => {
    state.respond = productRow;
    await run(setProductDatasheet, { id: ID, remove: true });
    const patch = writes()[0].ops.find(([op]) => op === "update")![1][0];
    expect(patch).toEqual({ datasheet_url: null, datasheet_name: null });
    expect(state.uploads).toHaveLength(0);
  });

  it("blocks non-admins", async () => {
    state.isAdmin = false;
    await expect(run(setProductDatasheet, { id: ID, pdf_base64: pdf })).rejects.toThrow("Admin role required");
    expect(state.uploads).toHaveLength(0);
  });
});
