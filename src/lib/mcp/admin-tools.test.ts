import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

type Call = { table: string; ops: [string, unknown[]][] };
type Result = { data?: unknown; error?: { message: string } | null; count?: number | null };

const state = vi.hoisted(() => ({
  isAdmin: true,
  calls: [] as { table: string; ops: [string, unknown[]][] }[],
  uploads: [] as string[],
  removed: [] as string[],
  signed: [] as string[],
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
        createSignedUploadUrl: async (path: string) => {
          state.signed.push(path);
          return { data: { signedUrl: `https://x.supabase.co/storage/v1/object/upload/sign/product-images/${path}?token=t`, token: "t", path }, error: null };
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
      for (const op of ["select", "insert", "update", "delete", "eq", "in", "or", "order", "limit", "gt"]) {
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
import createDatasheetUpload from "./tools/create-datasheet-upload";

const ctx = {
  isAuthenticated: () => true,
  getUserId: () => "00000000-0000-0000-0000-000000000001",
  getToken: () => "token",
} as unknown as ToolContext;

const ID = "11111111-1111-1111-1111-111111111111";
const run = (tool: { handler: (...a: never[]) => unknown }, input: unknown) =>
  (tool.handler as (i: unknown, c: ToolContext) => Promise<unknown>)(input, ctx);
/** The MCP runtime validates arguments against inputSchema before calling the handler; tests call handlers directly. */
const accepts = (tool: { inputSchema?: unknown }, input: unknown) =>
  z.object(tool.inputSchema as z.ZodRawShape).strict().safeParse(input).success;
const writes = () => state.calls.filter((c) => c.ops.some(([op]) => ["insert", "update", "delete"].includes(op)));

beforeEach(() => {
  state.isAdmin = true;
  state.calls = [];
  state.uploads = [];
  state.removed = [];
  state.signed = [];
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
  const ID2 = "22222222-2222-2222-2222-222222222222";
  const PUBLIC = "https://x.supabase.co/storage/v1/object/public/product-images/";
  const OLD = "datasheets/old.pdf";
  const NEW = "datasheets/abc-spec.pdf";
  const has = (c: Call, op: string) => c.ops.some(([o]) => o === op);

  /** Products table stub: `rows` are the current rows; `stillUsing` answers the reference count for old files. */
  const products =
    (rows: { id: string; datasheet_url: string | null }[], stillUsing = 0) =>
    (c: Call): Result => {
      if (has(c, "update")) {
        const patch = c.ops.find(([op]) => op === "update")![1][0] as object;
        return { data: rows.map((r) => ({ ...r, ...patch })) };
      }
      const select = c.ops.find(([op]) => op === "select")!;
      if (select[1][1]) return { count: stillUsing, data: null };
      return { data: rows };
    };
  const oldRow = (id = ID) => ({ id, datasheet_url: PUBLIC + OLD });

  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation(async () => new Response("%PDF-1.7 stored"));
    vi.stubGlobal("fetch", fetchMock);
    // Deno (where the function runs) has AbortSignal.timeout; the test DOM environment may not.
    if (typeof AbortSignal.timeout !== "function") {
      (AbortSignal as unknown as { timeout: () => AbortSignal }).timeout = () => new AbortController().signal;
    }
  });

  it("uploads a base64 PDF, saves the public link, and removes the unused previous file", async () => {
    state.respond = products([oldRow()]);
    const res = (await run(setProductDatasheet, { id: ID, pdf_base64: pdf, file_name: "spec.pdf" })) as {
      structuredContent: { product: { datasheetUrl: string; datasheetName: string } };
    };
    expect(state.uploads).toHaveLength(1);
    expect(state.uploads[0]).toMatch(/^datasheets\/.+\.pdf$/);
    expect(res.structuredContent.product.datasheetUrl).toContain(state.uploads[0]);
    expect(res.structuredContent.product.datasheetName).toBe("spec.pdf");
    expect(state.removed).toEqual([OLD]);
  });

  it("keeps the previous file when another product still uses it", async () => {
    state.respond = products([oldRow()], 42);
    await run(setProductDatasheet, { id: ID, pdf_base64: pdf });
    const countCall = state.calls.find((c) => (c.ops.find(([op]) => op === "select")?.[1][1] as { count?: string })?.count);
    expect(countCall!.ops).toContainEqual(["eq", ["datasheet_url", PUBLIC + OLD]]);
    expect(state.removed).toEqual([]);
  });

  it("attaches an already uploaded storage_path without re-uploading", async () => {
    state.respond = products([{ id: ID, datasheet_url: null }]);
    const res = (await run(setProductDatasheet, { id: ID, storage_path: NEW, file_name: "Spec.pdf" })) as {
      structuredContent: { product: { datasheetUrl: string; datasheetName: string } };
    };
    expect(fetchMock).toHaveBeenCalledWith(PUBLIC + NEW, expect.anything());
    expect(state.uploads).toHaveLength(0);
    expect(res.structuredContent.product.datasheetUrl).toBe(PUBLIC + NEW);
    expect(res.structuredContent.product.datasheetName).toBe("Spec.pdf");
  });

  it("rejects a storage_path that was never uploaded or is not a PDF", async () => {
    state.respond = products([{ id: ID, datasheet_url: null }]);
    fetchMock.mockImplementationOnce(async () => new Response("not found", { status: 400 }));
    await expect(run(setProductDatasheet, { id: ID, storage_path: NEW })).rejects.toThrow("No uploaded file");
    fetchMock.mockImplementationOnce(async () => new Response("<html>"));
    await expect(run(setProductDatasheet, { id: ID, storage_path: NEW })).rejects.toThrow("not a PDF");
    expect(writes()).toHaveLength(0);
  });

  it("only accepts storage paths inside datasheets/ and at most 100 product_ids", () => {
    expect(accepts(setProductDatasheet, { id: ID, storage_path: NEW })).toBe(true);
    expect(accepts(setProductDatasheet, { id: ID, storage_path: "products/x.pdf" })).toBe(false);
    expect(accepts(setProductDatasheet, { id: ID, storage_path: "datasheets/../x.pdf" })).toBe(false);
    expect(accepts(setProductDatasheet, { id: ID, storage_path: "datasheets/x.png" })).toBe(false);
    expect(accepts(setProductDatasheet, { product_ids: Array(100).fill(ID), storage_path: NEW })).toBe(true);
    expect(accepts(setProductDatasheet, { product_ids: Array(101).fill(ID), storage_path: NEW })).toBe(false);
  });

  it("links one file to many products with product_ids and keeps a file other products still share", async () => {
    state.respond = products([oldRow(ID), oldRow(ID2)], 3);
    const res = (await run(setProductDatasheet, { product_ids: [ID, ID2], storage_path: NEW })) as {
      structuredContent: { count: number; products: { datasheetUrl: string }[] };
    };
    const update = writes()[0];
    expect(update.ops).toContainEqual(["in", ["id", [ID, ID2]]]);
    expect(res.structuredContent.count).toBe(2);
    expect(res.structuredContent.products.every((p) => p.datasheetUrl === PUBLIC + NEW)).toBe(true);
    expect(state.removed).toEqual([]);
  });

  it("reports product ids that do not exist before writing", async () => {
    state.respond = products([oldRow(ID)]);
    await expect(run(setProductDatasheet, { product_ids: [ID, ID2], storage_path: NEW })).rejects.toThrow(ID2);
    expect(writes()).toHaveLength(0);
  });

  it("rejects files that are not PDFs without uploading", async () => {
    state.respond = products([oldRow()]);
    await expect(run(setProductDatasheet, { id: ID, pdf_base64: btoa("hello") })).rejects.toThrow("not a PDF");
    expect(state.uploads).toHaveLength(0);
  });

  it("requires exactly one source and exactly one target", async () => {
    await expect(run(setProductDatasheet, { id: ID })).rejects.toThrow("exactly one");
    await expect(run(setProductDatasheet, { id: ID, pdf_base64: pdf, remove: true })).rejects.toThrow("exactly one");
    await expect(run(setProductDatasheet, { id: ID, storage_path: NEW, pdf_base64: pdf })).rejects.toThrow("exactly one");
    await expect(run(setProductDatasheet, { storage_path: NEW })).rejects.toThrow("id or product_ids");
    await expect(run(setProductDatasheet, { id: ID, product_ids: [ID2], storage_path: NEW })).rejects.toThrow("id or product_ids");
  });

  it("remove clears the fields", async () => {
    state.respond = products([oldRow()]);
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

describe("create_datasheet_upload", () => {
  it("returns a signed upload URL for a safe path under datasheets/", async () => {
    const res = (await run(createDatasheetUpload, { file_name: "Indoor Fiber Patch Cord (v2).PDF" })) as {
      structuredContent: { upload_url: string; storage_path: string; public_url: string; curl: string };
    };
    const { upload_url, storage_path, public_url, curl } = res.structuredContent;
    expect(storage_path).toMatch(/^datasheets\/[0-9a-f-]{36}-indoor-fiber-patch-cord-v2\.pdf$/);
    expect(state.signed).toEqual([storage_path]);
    expect(upload_url).toContain("/object/upload/sign/product-images/" + storage_path);
    expect(public_url).toBe(`https://x.supabase.co/storage/v1/object/public/product-images/${storage_path}`);
    expect(curl).toBe(`curl -X PUT -H "Content-Type: application/pdf" --data-binary @"<local file>" "${upload_url}"`);
  });

  it("only accepts .pdf names", () => {
    expect(accepts(createDatasheetUpload, { file_name: "spec.pdf" })).toBe(true);
    expect(accepts(createDatasheetUpload, { file_name: "spec.docx" })).toBe(false);
    expect(accepts(createDatasheetUpload, { file_name: "" })).toBe(false);
  });

  it("blocks non-admins", async () => {
    state.isAdmin = false;
    await expect(run(createDatasheetUpload, { file_name: "spec.pdf" })).rejects.toThrow("Admin role required");
    expect(state.signed).toHaveLength(0);
  });
});
