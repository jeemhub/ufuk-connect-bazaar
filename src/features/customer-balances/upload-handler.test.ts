// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  handleImportCustomerBalances,
  type HandlerDependencies,
} from "../../../supabase/functions/import-customer-balances/handler";

function makeRequest(options: { token?: string; file?: File } = {}) {
  const formData = new FormData();
  if (options.file) formData.append("file", options.file);
  const headers = options.token ? { Authorization: `Bearer ${options.token}` } : undefined;
  return new Request("https://example.test/import-customer-balances", {
    method: "POST",
    headers,
    body: formData,
  });
}

describe("handleImportCustomerBalances", () => {
  let deps: HandlerDependencies;

  beforeEach(() => {
    deps = {
      authenticate: vi.fn().mockResolvedValue({ id: "user-1" }),
      canManage: vi.fn().mockResolvedValue(true),
      parseWorkbook: vi.fn().mockReturnValue([
        {
          customer_number: "1",
          customer_name: "عميل",
          debit_usd: "0",
          credit_usd: "0",
          debit_iqd: "0",
          credit_iqd: "0",
        },
      ]),
      replaceBalances: vi.fn().mockResolvedValue({ imported: 1 }),
    };
  });

  it("returns 401 before parsing when the bearer token is missing", async () => {
    const response = await handleImportCustomerBalances(makeRequest(), deps);

    expect(response.status).toBe(401);
    expect(deps.parseWorkbook).not.toHaveBeenCalled();
  });

  it("returns 403 before parsing when the user lacks permission", async () => {
    vi.mocked(deps.canManage).mockResolvedValue(false);
    const response = await handleImportCustomerBalances(makeRequest({ token: "token" }), deps);

    expect(response.status).toBe(403);
    expect(deps.parseWorkbook).not.toHaveBeenCalled();
  });

  it("rejects requests without exactly one file", async () => {
    const response = await handleImportCustomerBalances(makeRequest({ token: "token" }), deps);

    expect(response.status).toBe(400);
    expect(deps.replaceBalances).not.toHaveBeenCalled();
  });

  it("parses the file and replaces balances once", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "balances.xls", {
      type: "application/vnd.ms-excel",
    });
    const response = await handleImportCustomerBalances(makeRequest({ token: "token", file }), deps);

    const responseBody = await response.clone().json();
    expect(response.status, JSON.stringify(responseBody)).toBe(200);
    expect(await response.json()).toEqual({ imported: 1 });
    expect(deps.parseWorkbook).toHaveBeenCalledTimes(1);
    expect(deps.replaceBalances).toHaveBeenCalledTimes(1);
    expect(deps.replaceBalances).toHaveBeenCalledWith({
      fileName: "balances.xls",
      rows: expect.any(Array),
      token: "token",
    });
  });

  it("maps an active replacement lock to 409", async () => {
    vi.mocked(deps.replaceBalances).mockRejectedValue({ code: "55P03", message: "import in progress" });
    const file = new File([new Uint8Array([1])], "balances.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const response = await handleImportCustomerBalances(makeRequest({ token: "token", file }), deps);

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ code: "import_in_progress" });
  });

  it("does not replace old data when workbook validation fails", async () => {
    vi.mocked(deps.parseWorkbook).mockImplementation(() => {
      throw new Error("invalid workbook");
    });
    const file = new File([new Uint8Array([1])], "balances.xls", {
      type: "application/vnd.ms-excel",
    });
    const response = await handleImportCustomerBalances(makeRequest({ token: "token", file }), deps);

    expect(response.status).toBe(400);
    expect(deps.replaceBalances).not.toHaveBeenCalled();
  });
});
