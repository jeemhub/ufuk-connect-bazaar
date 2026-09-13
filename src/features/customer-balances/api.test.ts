import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  from: vi.fn(),
  invoke: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: mocks.rpc,
    from: mocks.from,
    functions: { invoke: mocks.invoke },
  },
}));

import {
  fetchCustomerBalanceImportState,
  fetchCustomerBalances,
  uploadCustomerBalances,
} from "./api";

describe("customer balance API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("normalizes search parameters and preserves decimal strings", async () => {
    mocks.rpc.mockResolvedValue({
      data: [
        {
          customer_number: "101",
          customer_name: " شركة Ecolog ",
          debit_usd: "1234.125",
          credit_usd: "0",
          debit_iqd: "0",
          credit_iqd: "9000",
          total_count: 17,
        },
      ],
      error: null,
    });

    await expect(
      fetchCustomerBalances({
        query: "  شركة   ECOLOG ",
        balanceType: "debit",
        currency: "usd",
        page: 2,
        pageSize: 50,
      }),
    ).resolves.toEqual({
      rows: [
        {
          customer_number: "101",
          customer_name: " شركة Ecolog ",
          debit_usd: "1234.125",
          credit_usd: "0",
          debit_iqd: "0",
          credit_iqd: "9000",
        },
      ],
      total: 17,
    });

    expect(mocks.rpc).toHaveBeenCalledWith("search_customer_balances", {
      _query: "شركة ecolog",
      _balance_type: "debit",
      _currency: "usd",
      _page: 2,
      _page_size: 50,
    });
  });

  it("returns an empty page without inventing a total", async () => {
    mocks.rpc.mockResolvedValue({ data: [], error: null });
    await expect(
      fetchCustomerBalances({ query: "", balanceType: "all", currency: "all", page: 1, pageSize: 50 }),
    ).resolves.toEqual({ rows: [], total: 0 });
  });

  it("loads nullable import metadata", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    mocks.from.mockReturnValue({ select });

    await expect(fetchCustomerBalanceImportState()).resolves.toBeNull();
    expect(mocks.from).toHaveBeenCalledWith("customer_balance_import_state");
    expect(select).toHaveBeenCalledWith("file_name, imported_at, imported_by, row_count");
    expect(eq).toHaveBeenCalledWith("singleton", true);
  });

  it("uploads the original file body through the server function", async () => {
    mocks.invoke.mockResolvedValue({ data: { imported: 1885 }, error: null });
    const file = new File([new Uint8Array([0xd0, 0xcf])], "1111.xls", {
      type: "application/vnd.ms-excel",
    });

    await expect(uploadCustomerBalances(file)).resolves.toEqual({ imported: 1885 });
    const [, options] = mocks.invoke.mock.calls[0];
    expect(mocks.invoke).toHaveBeenCalledWith("import-customer-balances", expect.any(Object));
    expect(options.body).toBeInstanceOf(FormData);
    const uploaded = options.body.get("file") as File;
    expect(uploaded.name).toBe("1111.xls");
    expect(uploaded.type).toBe("application/vnd.ms-excel");
    expect(uploaded.size).toBe(file.size);
  });

  it("surfaces server errors in Arabic", async () => {
    mocks.invoke.mockResolvedValue({ data: { error: "أعمدة الملف غير صحيحة" }, error: null });
    const file = new File(["bad"], "bad.xls", { type: "application/vnd.ms-excel" });
    await expect(uploadCustomerBalances(file)).rejects.toThrow("أعمدة الملف غير صحيحة");
  });
});
