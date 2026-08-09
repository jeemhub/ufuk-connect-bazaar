import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLanguage } from "@/i18n/LanguageContext";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemName?: string | null;
}

export function ConfirmDeleteDialog({ open, onOpenChange, onConfirm, title, description, itemName }: Props) {
  const { lang } = useLanguage();
  const ar = lang === "ar";

  const fallbackDesc = ar
    ? `لا يمكن التراجع عن هذا الإجراء.${itemName ? ` سيتم حذف "${itemName}" نهائياً.` : " سيتم الحذف نهائياً."}`
    : `This action cannot be undone.${itemName ? ` "${itemName}" will be permanently deleted.` : " The item will be permanently deleted."}`;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title ?? (ar ? "تأكيد الحذف" : "Confirm deletion")}</AlertDialogTitle>
          <AlertDialogDescription>{description ?? fallbackDesc}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{ar ? "إلغاء" : "Cancel"}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => { onConfirm(); onOpenChange(false); }}
          >
            {ar ? "حذف" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
