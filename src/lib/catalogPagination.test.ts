import { describe, expect, it } from "vitest";
import { collectCatalogPages } from "./catalogPagination";
describe("complete catalog pagination", () => {
  it("retrieves all1122rows beyond the PostgREST default cap", async () => {
    const all = Array.from({ length: 1122 }, (_, i) => ({ id: String(i).padStart(6, "0") }));
    const result = await collectCatalogPages(async (after, limit) => ({ data: all.filter(r => !after || r.id > after).slice(0, limit), error: null }));
    expect(result).toEqual(all);
  });
  it("rejects repeated or unordered pages rather than reporting a partial success", async () => {
    await expect(collectCatalogPages(async () => ({ data: [{ id: "a" }], error: null }), 1)).rejects.toThrow("pagination order");
  });
  it("propagates server errors instead of silently dropping remaining products", async () => {
    await expect(collectCatalogPages(async () => ({ data: null, error: { message: "unavailable" } }))).rejects.toThrow("unavailable");
  });
});
