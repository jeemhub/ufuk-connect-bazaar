import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { useApplyGlassThemeOnMount } from "@/hooks/useGlassTheme";

export default function AdminLayout() {
  // Apply the persisted Liquid Glass preference (per-admin) as early
  // as possible so the first paint is already themed.
  useApplyGlassThemeOnMount();

  return (
    <SidebarProvider defaultOpen>
      <div className="glass-stage glass-scope flex min-h-screen w-full bg-secondary/40">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminHeader />
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="animate-fade-in">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
