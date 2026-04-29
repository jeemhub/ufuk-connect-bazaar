import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { useLanguage } from "@/i18n/LanguageContext";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({
  children,
  requireAdmin = false,
  requireStaff = false,
  requirePerm,
}: {
  children: JSX.Element;
  requireAdmin?: boolean;
  requireStaff?: boolean;
  requirePerm?: keyof import("./AuthProvider").SalesPermissions;
}) {
  const { session, isAdmin, isStaff, salesPerms, loading } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>{t("auth_loading")}</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Forbidden message={t("auth_admin_only")} />;
  }

  if (requireStaff && !isStaff) {
    return <Forbidden message={t("auth_admin_only")} />;
  }

  if (requirePerm && !isAdmin && !salesPerms[requirePerm]) {
    return <Forbidden message="ليس لديك صلاحية للوصول إلى هذه الصفحة" />;
  }

  return children;
}

function Forbidden({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="surface-card max-w-md p-8 text-center">
        <h2 className="mb-2 text-xl font-bold text-destructive">403</h2>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
