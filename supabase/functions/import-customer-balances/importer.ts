import * as XLSX from "xlsx";

export const CUSTOMER_BALANCE_HEADERS = [
  "الرقم",
  "الاسم",
  "مدين دولار",
  "دائن دولار",
  "مدين دينار",
  "دائن دينار",
] as const;

export const MAX_CUSTOMER_BALANCE_FILE_SIZE = 5 * 1024 * 1024;
export const MAX_CUSTOMER_BALANCE_ROWS = 50_000;

export type CustomerBalanceImportRow = {
  customer_number: string;
  customer_name: string;
  debit_usd: string;
  credit_usd: string;
  debit_iqd: string;
  credit_iqd: string;
};

export type CustomerBalanceImportErrorCode =
  | "file_too_large"
  | "unsupported_file"
  | "signature_mismatch"
  | "unreadable_workbook"
  | "missing_worksheet"
  | "invalid_headers"
  | "formula_cell"
  | "empty_dataset"
  | "too_many_rows"
  | "missing_customer_number"
  | "missing_customer_name"
  | "duplicate_customer_number"
  | "invalid_amount";

const ERROR_MESSAGES: Record<CustomerBalanceImportErrorCode, string> = {
  file_too_large: "حجم الملف أكبر من الحد المسموح (5 ميغابايت).",
  unsupported_file: "يرجى اختيار ملف XLS أو XLSX فقط.",
  signature_mismatch: "محتوى الملف لا يطابق صيغة Excel المحددة.",
  unreadable_workbook: "تعذّر قراءة ملف Excel.",
  missing_worksheet: "لا يحتوي الملف على ورقة بيانات.",
  invalid_headers: "أعمدة الملف لا تطابق الأعمدة المطلوبة.",
  formula_cell: "لا يمكن اعتماد ملف يحتوي على صيغ Excel.",
  empty_dataset: "لا يحتوي الملف على سجلات أرصدة.",
  too_many_rows: "يحتوي الملف على عدد سجلات أكبر من الحد المسموح.",
  missing_customer_number: "يوجد سجل بدون رقم عميل.",
  missing_customer_name: "يوجد سجل بدون اسم عميل.",
  duplicate_customer_number: "يحتوي الملف على رقم عميل مكرر.",
  invalid_amount: "يوجد مبلغ غير صالح في الملف.",
};

export class CustomerBalanceImportError extends Error {
  constructor(
    public readonly code: CustomerBalanceImportErrorCode,
    message = ERROR_MESSAGES[code],
  ) {
    super(message);
    this.name = "CustomerBalanceImportError";
  }
}

type ParseInput = {
  bytes: Uint8Array;
  fileName: string;
  mimeType: string;
};

const XLS_MIME_TYPES = new Set([
  "application/vnd.ms-excel",
  "application/octet-stream",
  "",
]);

const XLSX_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "application/octet-stream",
  "",
]);

function hasPrefix(bytes: Uint8Array, prefix: number[]): boolean {
  return prefix.every((value, index) => bytes[index] === value);
}

function isBlank(value: unknown): boolean {
  return value === null || value === undefined || String(value).trim() === "";
}

function numberToPlainString(value: number): string {
  const raw = String(value);
  if (!/[eE]/.test(raw)) return raw;

  const [coefficient, exponentText] = raw.toLowerCase().split("e");
  const exponent = Number(exponentText);
  const sign = coefficient.startsWith("-") ? "-" : "";
  const digits = coefficient.replace("-", "").replace(".", "");
  const decimalPosition = coefficient.replace("-", "").indexOf(".");
  const basePosition = decimalPosition === -1 ? digits.length : decimalPosition;
  const targetPosition = basePosition + exponent;

  if (targetPosition <= 0) return `${sign}0.${"0".repeat(-targetPosition)}${digits}`;
  if (targetPosition >= digits.length) {
    return `${sign}${digits}${"0".repeat(targetPosition - digits.length)}`;
  }
  return `${sign}${digits.slice(0, targetPosition)}.${digits.slice(targetPosition)}`;
}

function parseAmount(value: unknown, rowNumber: number, columnName: string): string {
  if (isBlank(value)) return "0";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new CustomerBalanceImportError(
        "invalid_amount",
        `المبلغ في الصف ${rowNumber} والعمود «${columnName}» غير صالح.`,
      );
    }
    return numberToPlainString(value);
  }

  const normalized = String(value).trim().replace(/,/g, "");
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) {
    throw new CustomerBalanceImportError(
      "invalid_amount",
      `المبلغ في الصف ${rowNumber} والعمود «${columnName}» غير صالح.`,
    );
  }
  return normalized.startsWith("+") ? normalized.slice(1) : normalized;
}

function validateFileEnvelope(input: ParseInput): "xls" | "xlsx" {
  if (input.bytes.byteLength > MAX_CUSTOMER_BALANCE_FILE_SIZE) {
    throw new CustomerBalanceImportError("file_too_large");
  }

  const extension = input.fileName.toLocaleLowerCase("en").match(/\.(xlsx|xls)$/)?.[1];
  if (!extension) throw new CustomerBalanceImportError("unsupported_file");

  const normalizedMime = input.mimeType.toLocaleLowerCase("en").split(";", 1)[0].trim();
  const allowedMimes = extension === "xls" ? XLS_MIME_TYPES : XLSX_MIME_TYPES;
  if (!allowedMimes.has(normalizedMime)) {
    throw new CustomerBalanceImportError("unsupported_file");
  }

  const isOle = hasPrefix(input.bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  const isZip = hasPrefix(input.bytes, [0x50, 0x4b, 0x03, 0x04]);
  if ((extension === "xls" && !isOle) || (extension === "xlsx" && !isZip)) {
    throw new CustomerBalanceImportError("signature_mismatch");
  }

  return extension;
}

export function parseCustomerBalanceWorkbook(input: ParseInput): CustomerBalanceImportRow[] {
  validateFileEnvelope(input);

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(input.bytes, {
      type: "array",
      cellFormula: true,
      cellHTML: false,
      cellNF: false,
      cellText: false,
    });
  } catch {
    throw new CustomerBalanceImportError("unreadable_workbook");
  }

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) throw new CustomerBalanceImportError("missing_worksheet");
  const sheet = workbook.Sheets[firstSheetName];
  if (!sheet) throw new CustomerBalanceImportError("missing_worksheet");

  for (const [address, cell] of Object.entries(sheet)) {
    if (!address.startsWith("!") && cell && typeof cell === "object" && "f" in cell && cell.f) {
      throw new CustomerBalanceImportError("formula_cell");
    }
  }

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: true,
    defval: null,
    blankrows: true,
  });
  const headerIndex = matrix.findIndex((row) => Array.isArray(row) && row.some((value) => !isBlank(value)));
  if (headerIndex === -1) throw new CustomerBalanceImportError("invalid_headers");

  const receivedHeaders = (matrix[headerIndex] ?? []).map((value) => String(value ?? "").trim());
  const headersMatch =
    receivedHeaders.length === CUSTOMER_BALANCE_HEADERS.length &&
    CUSTOMER_BALANCE_HEADERS.every((header, index) => receivedHeaders[index] === header);
  if (!headersMatch) throw new CustomerBalanceImportError("invalid_headers");

  const rows: CustomerBalanceImportRow[] = [];
  const customerNumbers = new Set<string>();
  for (let index = headerIndex + 1; index < matrix.length; index += 1) {
    const row = matrix[index] ?? [];
    if (row.every(isBlank)) continue;
    if (rows.length >= MAX_CUSTOMER_BALANCE_ROWS) {
      throw new CustomerBalanceImportError("too_many_rows");
    }

    const rowNumber = index + 1;
    if (isBlank(row[0])) {
      throw new CustomerBalanceImportError(
        "missing_customer_number",
        `يوجد سجل بدون رقم عميل في الصف ${rowNumber}.`,
      );
    }
    if (isBlank(row[1])) {
      throw new CustomerBalanceImportError(
        "missing_customer_name",
        `يوجد سجل بدون اسم عميل في الصف ${rowNumber}.`,
      );
    }

    const customerNumber = String(row[0]);
    if (customerNumbers.has(customerNumber)) {
      throw new CustomerBalanceImportError(
        "duplicate_customer_number",
        `رقم العميل «${customerNumber}» مكرر في الملف.`,
      );
    }
    customerNumbers.add(customerNumber);

    rows.push({
      customer_number: customerNumber,
      customer_name: String(row[1]),
      debit_usd: parseAmount(row[2], rowNumber, CUSTOMER_BALANCE_HEADERS[2]),
      credit_usd: parseAmount(row[3], rowNumber, CUSTOMER_BALANCE_HEADERS[3]),
      debit_iqd: parseAmount(row[4], rowNumber, CUSTOMER_BALANCE_HEADERS[4]),
      credit_iqd: parseAmount(row[5], rowNumber, CUSTOMER_BALANCE_HEADERS[5]),
    });
  }

  if (rows.length === 0) throw new CustomerBalanceImportError("empty_dataset");
  return rows;
}
