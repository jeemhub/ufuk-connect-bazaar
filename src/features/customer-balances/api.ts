import { supabase } from "@/integrations/supabase/client";

import {
  normalizeBalanceSearch,
  type BalanceCurrency,
  type BalanceType,
  type CustomerBalanceImportState,
  type CustomerBalanceRow,
  type CustomerBalanceSearchResponse,
} from "./model";

export type CustomerBalanceSearchParams = {
  query: string;
  balanceType: BalanceType;
  currency: BalanceCurrency;
  page: number;
  pageSize: number;
};

type SearchRow = CustomerBalanceRow & { total_count: number | string };

function messageFrom(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}

export async function fetchCustomerBalances(
  params: CustomerBalanceSearchParams,
): Promise<CustomerBalanceSearchResponse> {
  const { data, error } = await supabase.rpc("search_customer_balances", {
    _query: normalizeBalanceSearch(params.query),
    _balance_type: params.balanceType,
    _currency: params.currency,
    _page: params.page,
    _page_size: params.pageSize,
  });

  if (error) throw new Error(messageFrom(error, "تعذّر تحميل أرصدة العملاء"));

  const result = (data ?? []) as SearchRow[];
  return {
    rows: result.map(({ total_count: _totalCount, ...row }) => row),
    total: result.length > 0 ? Number(result[0].total_count) : 0,
  };
}

export async function fetchCustomerBalanceImportState(): Promise<CustomerBalanceImportState | null> {
  const { data, error } = await supabase
    .from("customer_balance_import_state")
    .select("file_name, imported_at, imported_by, row_count")
    .eq("singleton", true)
    .maybeSingle();

  if (error) throw new Error(messageFrom(error, "تعذّر تحميل معلومات آخر ملف"));
  return data as CustomerBalanceImportState | null;
}

export async function uploadCustomerBalances(file: File): Promise<{ imported: number }> {
  const body = new FormData();
  body.append("file", file, file.name);

  const { data, error } = await supabase.functions.invoke("import-customer-balances", { body });
  if (error) throw new Error(messageFrom(error, "تعذّر رفع ملف الأرصدة"));

  if (data?.error) throw new Error(String(data.error));
  if (!data || typeof data.imported !== "number") {
    throw new Error("لم يُرجع الخادم نتيجة صالحة لعملية الرفع");
  }
  return { imported: data.imported };
}
