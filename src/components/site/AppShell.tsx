import { ReactNode } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { BlockedScreen } from "@/components/site/BlockedScreen";
import { usePageView } from "@/hooks/usePageView";

export function AppShell({ children }: { children: ReactNode }) {
  const { isBlocked, isAdmin, loading } = useAuth();
  usePageView();

  if (!loading && isBlocked && !isAdmin) {
    return <BlockedScreen />;
  }
  return <>{children}</>;
}
