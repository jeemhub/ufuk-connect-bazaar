import { Link, NavLink } from "react-router-dom";
import { Languages, LogOut, ShieldCheck, User as UserIcon, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthProvider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { NotificationBell } from "@/components/site/NotificationBell";
import { PushToggleButton } from "@/components/site/PushToggleButton";
import logo from "@/assets/logo.png";

export function SiteHeader() {
  const { t, lang, toggle } = useLanguage();
  const { user, isAdmin, pricingTier, avatarUrl, fullName, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const links = [
    { to: "/", label: t("nav_home"), end: true },
    { to: "/products", label: t("nav_shop") },
    { to: "/blog", label: t("nav_blog") },
    { to: "/quote", label: t("request_quote") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt={t("brand")} className="h-16 w-16 md:h-20 md:w-20 object-contain drop-shadow-sm" />
          <div className="hidden sm:block">
            <div className="text-base font-bold leading-tight">{t("brand")}</div>
            <div className="text-[11px] text-muted-foreground">IT · Networking · Solar</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end as any} className={({ isActive }) =>
              `rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? "bg-primary/10 text-primary" : "text-foreground/70 hover:bg-accent hover:text-foreground"}`
            }>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={toggle} className="gap-1">
            <Languages className="h-4 w-4" />
            <span className="hidden sm:inline">{lang === "ar" ? "EN" : "ع"}</span>
          </Button>

          {user ? <NotificationBell /> : <PushToggleButton />}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={user.email ?? "account"}
                  className={`tier-ring tier-ring-${pricingTier} relative inline-flex h-12 w-12 items-center justify-center rounded-full p-1 transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background`}
                >
                  <Avatar className="h-10 w-10">
                    {avatarUrl ? <AvatarImage src={avatarUrl} alt={fullName ?? user.email ?? ""} /> : null}
                    <AvatarFallback className="bg-gradient-brand text-xs font-bold text-primary-foreground">
                      {(fullName || user.email || "U").trim().slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to="/account"><UserIcon className="me-2 h-4 w-4" />{t("my_account")}</Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin"><ShieldCheck className="me-2 h-4 w-4" />{t("admin_panel")}</Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="me-2 h-4 w-4" />{t("sign_out")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="bg-gradient-brand">
              <Link to="/auth">{t("sign_in")}</Link>
            </Button>
          )}

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col px-4 py-2">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end as any} onClick={() => setOpen(false)}
                className={({ isActive }) => `rounded-md px-3 py-2 text-sm font-medium ${isActive ? "bg-primary/10 text-primary" : "text-foreground/80"}`}>
                {l.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
