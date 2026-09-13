export type BalanceType = "all" | "debit" | "credit";
export type BalanceCurrency = "all" | "usd" | "iqd";

export type CustomerBalanceRow = {
  customer_number: string;
  customer_name: string;
  debit_usd: string;
  credit_usd: string;
  debit_iqd: string;
  credit_iqd: string;
};

export type CustomerBalanceSearchResponse = {
  rows: CustomerBalanceRow[];
  total: number;
};

export type CustomerBalanceImportState = {
  file_name: string;
  imported_at: string;
  imported_by: string;
  row_count: number;
};

export function normalizeBalanceSearch(value: string): string {
  return value.trim().replace(/\s+/gu, " ").toLocaleLowerCase("en");
}

export function formatBalanceAmount(value: string): string {
  const normalized = value.trim();
  if (!normalized || /^[-+]?0+(?:\.0+)?$/.test(normalized)) return "—";

  const match = normalized.match(/^([+-]?)(\d+)(?:\.(\d+))?$/);
  if (!match) return normalized;

  const [, sign, integer, fraction] = match;
  const formattedInteger = BigInt(integer).toLocaleString("en-US");
  const prefix = sign === "-" ? "-" : "";
  return fraction === undefined
    ? `${prefix}${formattedInteger}`
    : `${prefix}${formattedInteger}.${fraction}`;
}

export function getPageCount(total: number, pageSize: number): number {
  if (total <= 0 || pageSize <= 0) return 0;
  return Math.ceil(total / pageSize);
}
