import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomerBalanceUpload } from "@/features/customer-balances/CustomerBalanceUpload";
import { CustomerBalancesTable } from "@/features/customer-balances/CustomerBalancesTable";
import { getPageCount, type BalanceCurrency, type BalanceType } from "@/features/customer-balances/model";
import { useCustomerBalances } from "@/features/customer-balances/useCustomerBalances";

const PAGE_SIZE = 50;

export default function CustomerBalances() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [balanceType, setBalanceType] = useState<BalanceType>("all");
  const [currency, setCurrency] = useState<BalanceCurrency>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    document.title = "أرصدة العملاء · لوحة التحكم";
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const balances = useCustomerBalances({
    query: debouncedSearch,
    balanceType,
    currency,
    page,
    pageSize: PAGE_SIZE,
  });
  const total = balances.data?.total ?? 0;
  const pageCount = getPageCount(total, PAGE_SIZE);

  const resetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setBalanceType("all");
    setCurrency("all");
    setPage(1);
  };

  return (
    <div className="space-y-6" dir="rtl">
      <header>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">أرصدة العملاء</h1>
        <p className="mt-1 text-sm text-muted-foreground">البحث واستعراض أرصدة العملاء بالدولار والدينار</p>
      </header>

      <CustomerBalanceUpload />

      <section className="surface-card space-y-4 p-4 sm:p-5" aria-label="البحث والتصفية">
        <div className="relative mx-auto max-w-3xl">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ابحث باسم العميل أو رقمه"
            className="h-12 pr-10 text-base"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="balance-type">نوع الرصيد</Label>
            <Select
              value={balanceType}
              onValueChange={(value: BalanceType) => { setBalanceType(value); setPage(1); }}
            >
              <SelectTrigger id="balance-type" aria-label="نوع الرصيد"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأرصدة</SelectItem>
                <SelectItem value="debit">مدين</SelectItem>
                <SelectItem value="credit">دائن</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="balance-currency">العملة</Label>
            <Select
              value={currency}
              onValueChange={(value: BalanceCurrency) => { setCurrency(value); setPage(1); }}
            >
              <SelectTrigger id="balance-currency" aria-label="العملة"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع العملات</SelectItem>
                <SelectItem value="usd">دولار</SelectItem>
                <SelectItem value="iqd">دينار عراقي</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="button" variant="outline" className="gap-2" onClick={resetFilters}>
            <RotateCcw className="h-4 w-4" /> إعادة ضبط الفلاتر
          </Button>
        </div>
      </section>

      <section className="surface-card space-y-4 p-4 sm:p-5" aria-label="نتائج أرصدة العملاء">
        <div className="flex items-center justify-between gap-3 text-sm">
          <p className="font-medium">عدد النتائج: {total.toLocaleString("en-US")}</p>
          {balances.isFetching && !balances.isLoading && <span className="text-muted-foreground">جارٍ تحديث النتائج...</span>}
        </div>

        {balances.error ? (
          <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            تعذّر تحميل الأرصدة. يرجى المحاولة مرة أخرى.
          </div>
        ) : (
          <CustomerBalancesTable rows={balances.data?.rows ?? []} isLoading={balances.isLoading} />
        )}

        {pageCount > 1 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-border pt-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">الصفحة {page} من {pageCount}</p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label="الصفحة السابقة"
                disabled={page <= 1 || balances.isFetching}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                <ChevronRight className="h-4 w-4" /> السابق
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label="الصفحة التالية"
                disabled={page >= pageCount || balances.isFetching}
                onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
              >
                التالي <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
