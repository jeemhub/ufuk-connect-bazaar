import { LayoutDashboard, Package, FolderTree, ShoppingCart, Users, Settings, ShieldCheck, MessageSquareQuote, Newspaper, Award } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

export function AdminSidebar() {
  const { t, lang } = useLanguage();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const items = [
    { to: "/admin", end: true, icon: LayoutDashboard, label: t("nav_dashboard") },
    { to: "/admin/products", icon: Package, label: t("nav_products") },
    { to: "/admin/categories", icon: FolderTree, label: t("nav_categories") },
    { to: "/admin/brands", icon: Award, label: t("admin_brands") },
    { to: "/admin/blog", icon: Newspaper, label: t("admin_blog") },
    { to: "/admin/orders", icon: ShoppingCart, label: t("nav_orders") },
    { to: "/admin/users", icon: Users, label: t("users_title") },
    { to: "/admin/quotes", icon: MessageSquareQuote, label: t("nav_quotes") },
    { to: "/admin/security", icon: ShieldCheck, label: t("nav_security") },
    { to: "/admin/settings", icon: Settings, label: t("nav_settings") },
  ];

  return (
    <Sidebar collapsible="icon" side={lang === "ar" ? "right" : "left"}>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-brand shadow-glow">
            <span className="font-bold text-primary-foreground">U</span>
          </div>
          {!collapsed && (
            <div className="min-w-0 animate-fade-in">
              <div className="truncate text-sm font-bold text-sidebar-foreground">{t("brand")}</div>
              <div className="truncate text-[10px] text-sidebar-foreground/60">{t("admin_panel")}</div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild tooltip={item.label}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="!bg-sidebar-primary !text-sidebar-primary-foreground font-semibold shadow-glow"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
