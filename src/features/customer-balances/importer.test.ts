import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";

import {
  CustomerBalanceImportError,
  MAX_CUSTOMER_BALANCE_FILE_SIZE,
  parseCustomerBalanceWorkbook,
} from "../../../supabase/functions/import-customer-balances/importer";

const HEADERS = [
  "الرقم",
  "الاسم",
  "مدين دولار",
  "دائن دولار",
  "مدين دينار",
  "دائن دينار",
];

function makeWorkbook(
  bookType: "xls" | "xlsx",
  rows: unknown[][],
): Uint8Array {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), "excel1");
  const output = XLSX.write(workbook, { bookType, type: "array" });
  return new Uint8Array(output as ArrayBuffer);
}

function expectImportError(run: () => unknown, code: string) {
  try {
    run();
    throw new Error("Expected customer balance import to fail");
  } catch (error) {
    expect(error).toBeInstanceOf(CustomerBalanceImportError);
    expect((error as CustomerBalanceImportError).code).toBe(code);
  }
}

describe("parseCustomerBalanceWorkbook", () => {
  it.each([
    ["xls", "balances.xls", "application/vnd.ms-excel"],
    [
      "xlsx",
      "balances.xlsx",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
  ] as const)("parses a valid %s workbook as data", (bookType, fileName, mimeType) => {
    const bytes = makeWorkbook(bookType, [
      HEADERS,
      [101, " أحمد ", 12.125, null, 1000, 0],
    ]);

    expect(parseCustomerBalanceWorkbook({ bytes, fileName, mimeType })).toEqual([
      {
        customer_number: "101",
        customer_name: " أحمد ",
        debit_usd: "12.125",
        credit_usd: "0",
        debit_iqd: "1000",
        credit_iqd: "0",
      },
    ]);
  });

  it("rejects unsupported extensions and mismatched binary signatures", () => {
    const xls = makeWorkbook("xls", [HEADERS, [1, "عميل", 0, 0, 0, 0]]);
    expectImportError(
      () => parseCustomerBalanceWorkbook({ bytes: xls, fileName: "balances.csv", mimeType: "text/csv" }),
      "unsupported_file",
    );
    expectImportError(
      () =>
        parseCustomerBalanceWorkbook({
          bytes: xls,
          fileName: "balances.xlsx",
          mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
      "signature_mismatch",
    );
  });

  it("rejects files above five MiB before parsing", () => {
    const bytes = new Uint8Array(MAX_CUSTOMER_BALANCE_FILE_SIZE + 1);
    bytes.set([0x50, 0x4b, 0x03, 0x04]);
    expectImportError(
      () =>
        parseCustomerBalanceWorkbook({
          bytes,
          fileName: "balances.xlsx",
          mimeType: "application/octet-stream",
        }),
      "file_too_large",
    );
  });

  it("rejects missing or reordered headers", () => {
    const reordered = [...HEADERS];
    [reordered[0], reordered[1]] = [reordered[1], reordered[0]];
    expectImportError(
      () =>
        parseCustomerBalanceWorkbook({
          bytes: makeWorkbook("xlsx", [reordered, [1, "عميل", 0, 0, 0, 0]]),
          fileName: "balances.xlsx",
          mimeType: "application/octet-stream",
        }),
      "invalid_headers",
    );
  });

  it("rejects formula cells instead of evaluating cached results", () => {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([HEADERS, [1, "عميل", 0, 0, 0, 0]]);
    sheet.C2 = { t: "n", v: 2, f: "1+1" };
    XLSX.utils.book_append_sheet(workbook, sheet, "excel1");
    const bytes = new Uint8Array(XLSX.write(workbook, { bookType: "xlsx", type: "array" }) as ArrayBuffer);

    expectImportError(
      () =>
        parseCustomerBalanceWorkbook({
          bytes,
          fileName: "balances.xlsx",
          mimeType: "application/octet-stream",
        }),
      "formula_cell",
    );
  });

  it("rejects duplicate or missing customer identifiers", () => {
    const cases: Array<[unknown[][], string]> = [
      [[HEADERS, [1, "الأول", 0, 0, 0, 0], [1, "الثاني", 0, 0, 0, 0]], "duplicate_customer_number"],
      [[HEADERS, [null, "عميل", 0, 0, 0, 0]], "missing_customer_number"],
      [[HEADERS, [1, " ", 0, 0, 0, 0]], "missing_customer_name"],
    ];

    for (const [rows, code] of cases) {
      expectImportError(
        () =>
          parseCustomerBalanceWorkbook({
            bytes: makeWorkbook("xlsx", rows),
            fileName: "balances.xlsx",
            mimeType: "application/octet-stream",
          }),
        code,
      );
    }
  });

  it("rejects invalid amounts and empty datasets", () => {
    expectImportError(
      () =>
        parseCustomerBalanceWorkbook({
          bytes: makeWorkbook("xlsx", [HEADERS, [1, "عميل", "12 USD", 0, 0, 0]]),
          fileName: "balances.xlsx",
          mimeType: "application/octet-stream",
        }),
      "invalid_amount",
    );
    expectImportError(
      () =>
        parseCustomerBalanceWorkbook({
          bytes: makeWorkbook("xlsx", [HEADERS]),
          fileName: "balances.xlsx",
          mimeType: "application/octet-stream",
        }),
      "empty_dataset",
    );
  });

  it("rejects more than 50,000 data records", () => {
    const rows = Array.from({ length: 50_001 }, (_, index) => [index + 1, "ع", null, null, null, null]);
    expectImportError(
      () =>
        parseCustomerBalanceWorkbook({
          bytes: makeWorkbook("xlsx", [HEADERS, ...rows]),
          fileName: "balances.xlsx",
          mimeType: "application/octet-stream",
        }),
      "too_many_rows",
    );
  }, 20_000);
});
