import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

import { uploadCustomerBalances } from "./api";
import { useCustomerBalanceImportState } from "./useCustomerBalances";

export function CustomerBalanceUpload() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const importState = useCustomerBalanceImportState();

  const mutation = useMutation({
    mutationFn: uploadCustomerBalances,
    onSuccess: async () => {
      toast.success("تم تحديث ملف الأرصدة بنجاح");
      setConfirmOpen(false);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["customer-balances"] }),
        queryClient.invalidateQueries({ queryKey: ["customer-balance-import-state"] }),
      ]);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "فشل رفع ملف الأرصدة");
      setConfirmOpen(false);
    },
  });

  const chooseFile = (selected: File | undefined) => {
    if (!selected) return;
    if (!/\.(xls|xlsx)$/iu.test(selected.name)) {
      toast.error("صيغة الملف غير مدعومة. اختر ملف XLS أو XLSX");
      return;
    }
    setFile(selected);
    setConfirmOpen(true);
  };

  return (
    <section className="surface-card space-y-4 p-4 sm:p-5" aria-labelledby="balance-upload-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="balance-upload-title" className="font-semibold">تحديث ملف الأرصدة</h2>
          <p className="mt-1 text-sm text-muted-foreground">ملف Excel بصيغة XLS أو XLSX، بحد أقصى 5 ميغابايت.</p>
        </div>
        <Button
          type="button"
          className="gap-2 sm:self-center"
          disabled={mutation.isPending}
          onClick={() => fileInputRef.current?.click()}
        >
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {mutation.isPending ? "جارٍ الرفع..." : "رفع ملف جديد"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          aria-label="اختيار ملف الأرصدة"
          className="sr-only"
          disabled={mutation.isPending}
          onChange={(event) => chooseFile(event.target.files?.[0])}
        />
      </div>

      {file && <span className="inline-flex items-center gap-2 text-sm"><FileSpreadsheet className="h-4 w-4 text-primary" />{file.name}</span>}

      <div className="border-t border-border pt-3 text-sm text-muted-foreground">
        {importState.isLoading ? (
          "جارٍ تحميل معلومات آخر ملف..."
        ) : importState.data ? (
          <p>
            آخر ملف: <strong className="font-medium text-foreground">{importState.data.file_name}</strong>
            {" · "}آخر تحديث: {new Date(importState.data.imported_at).toLocaleString("ar-IQ-u-nu-latn")}
            {" · "}{importState.data.row_count.toLocaleString("en-US")} سجل
          </p>
        ) : (
          "لم يتم رفع ملف أرصدة بعد."
        )}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={(open) => !mutation.isPending && setConfirmOpen(open)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد استبدال بيانات الأرصدة</AlertDialogTitle>
            <AlertDialogDescription>
              سيؤدي رفع الملف الجديد إلى استبدال بيانات الأرصدة الحالية بالكامل. هل تريد المتابعة؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutation.isPending}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              disabled={!file || mutation.isPending}
              onClick={(event) => {
                event.preventDefault();
                if (file && !mutation.isPending) mutation.mutate(file);
              }}
            >
              {mutation.isPending ? "جارٍ الرفع..." : "متابعة"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
