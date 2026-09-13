import { Loader2 } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { formatBalanceAmount, type CustomerBalanceRow } from "./model";

type Props = {
  rows: CustomerBalanceRow[];
  isLoading: boolean;
};

const columns = [
  { key: "customer_number", label: "رقم العميل", kind: "identity" },
  { key: "customer_name", label: "اسم العميل", kind: "name" },
  { key: "debit_usd", label: "مدين – دولار", kind: "debit" },
  { key: "credit_usd", label: "دائن – دولار", kind: "credit" },
  { key: "debit_iqd", label: "مدين – دينار", kind: "debit" },
  { key: "credit_iqd", label: "دائن – دينار", kind: "credit" },
] as const;

export function CustomerBalancesTable({ rows, isLoading }: Props) {
  return (
    <div
      data-testid="balances-scroll"
      className="max-h-[65vh] overflow-x-auto overflow-y-auto rounded-xl border border-border"
    >
      <Table className="min-w-[900px]">
        <TableHeader>
          <TableRow className="hover:bg-muted/70">
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={cn(
                  "sticky top-0 z-10 whitespace-nowrap bg-muted/95 font-semibold backdrop-blur",
                  column.kind === "name" ? "text-start" : "text-end tabular-nums",
                )}
              >
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> جارٍ تحميل الأرصدة...
                </span>
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                لا توجد نتائج مطابقة لبحثك
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.customer_number}>
                {columns.map((column) => {
                  const raw = row[column.key];
                  const isAmount = column.kind === "debit" || column.kind === "credit";
                  return (
                    <TableCell
                      key={column.key}
                      dir={column.kind === "name" ? "rtl" : "ltr"}
                      className={cn(
                        "whitespace-nowrap",
                        column.kind === "name" ? "text-right font-medium" : "text-right tabular-nums",
                        column.kind === "debit" && "text-amber-700 dark:text-amber-300",
                        column.kind === "credit" && "text-emerald-700 dark:text-emerald-300",
                      )}
                    >
                      {isAmount ? formatBalanceAmount(raw) : raw}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
