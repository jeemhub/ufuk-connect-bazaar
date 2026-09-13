import { useQuery } from "@tanstack/react-query";

import {
  fetchCustomerBalanceImportState,
  fetchCustomerBalances,
  type CustomerBalanceSearchParams,
} from "./api";
import { normalizeBalanceSearch } from "./model";

export const customerBalancesKey = (params: CustomerBalanceSearchParams) => [
  "customer-balances",
  normalizeBalanceSearch(params.query),
  params.balanceType,
  params.currency,
  params.page,
  params.pageSize,
] as const;

export function useCustomerBalances(params: CustomerBalanceSearchParams) {
  return useQuery({
    queryKey: customerBalancesKey(params),
    queryFn: () => fetchCustomerBalances(params),
    placeholderData: (previous) => previous,
  });
}

export function useCustomerBalanceImportState() {
  return useQuery({
    queryKey: ["customer-balance-import-state"],
    queryFn: fetchCustomerBalanceImportState,
  });
}
