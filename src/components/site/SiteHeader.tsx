import { Link, NavLink } from "react-router-dom";
import { Languages, LogOut, ShieldCheck, User as UserIcon, Menu, X, BadgeCheck, ShoppingCart, Wrench } from "lucide-react";
import { useCart } from "@/cart/CartContext";
import { useEffect, useState } from "react";
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
  const { user, isAdmin, isSales, pricingTier, avatarUrl, fullName, isVerified, signOut } = useAuth();
  const { count: cartCount, setOpen: setCartOpen } = useCart();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { to: "/", label: t("nav_home"), end: true },
    { to: "/products", label: t("nav_shop") },
    { to: "/projects", label: t("nav_projects") },
    { to: "/blog", label: t("nav_blog") },
    { to: "/about", label: t("nav_about") },
    { to: "/quote", label: t("request_quote") },
  ];

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* Floating glass pill */}
      <div className={`mx-auto px-3 md:px-6 transition-all duration-500 ${scrolled ? "max-w-6xl pt-2 md:pt-3" : "max-w-7xl pt-3 md:pt-5"}`}>
        <div
          className={`relative flex items-center justify-between gap-2 rounded-2xl border border-white/40 dark:border-white/10 bg-white/55 dark:bg-background/40 px-3 md:px-5 backdrop-blur-2xl transition-all duration-500 ${
            scrolled
              ? "h-14 shadow-[0_8px_30px_-12px_hsl(217_91%_32%/0.25)]"
              : "h-16 md:h-[68px] shadow-[0_10px_40px_-16px_hsl(217_91%_32%/0.18)]"
          }`}
          style={{
            backgroundImage:
              "linear-gradient(135deg, hsl(0 0% 100% / 0.6), hsl(0 0% 100% / 0.25))",
          }}
        >
          {/* Glass highlight */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-3 top-0 h-px rounded-full bg-gradient-to-r from-transparent via-white/80 to-transparent"
          />

          {/* Logo */}
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <div className="relative">
              <div aria-hidden className="absolute inset-0 rounded-full bg-primary/20 blur-md" />
              <img src={logo} alt={t("brand")} className="relative h-10 w-10 md:h-11 md:w-11 object-contain" />
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="text-sm font-bold tracking-tight">{t("brand")}</div>
              <div className="text-[10px] text-muted-foreground">IT · Networking · Solar</div>
            </div>
          </Link>

          {/* Center nav */}
          <nav className="hidden items-center gap-0.5 rounded-full border border-white/40 bg-white/40 p-1 backdrop-blur-xl md:flex">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end as any}
                className={({ isActive }) =>
                  `relative rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-[0_4px_14px_-4px_hsl(217_91%_32%/0.5)]"
                      : "text-foreground/70 hover:text-foreground hover:bg-white/60"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={toggle} className="h-9 gap-1 rounded-full hover:bg-white/60">
              <Languages className="h-4 w-4" />
              <span className="hidden sm:inline text-xs font-semibold">{lang === "ar" ? "EN" : "ع"}</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCartOpen(true)}
              aria-label="cart"
              className="relative h-9 w-9 rounded-full hover:bg-white/60"
            >
              <ShoppingCart className="h-4 w-4" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -end-0.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Button>

            {user ? <NotificationBell /> : <PushToggleButton />}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={user.email ?? "account"}
                    className="group inline-flex items-center gap-1.5 rounded-full p-0.5 transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <span
                      style={
                        isAdmin
                          ? {
                              background:
                                "conic-gradient(from 0deg, hsl(45 95% 65%), hsl(40 100% 50%), hsl(35 90% 45%), hsl(50 100% 70%), hsl(40 100% 50%), hsl(45 95% 65%))",
                              boxShadow: "0 0 10px hsl(45 95% 55% / 0.55)",
                            }
                          : {
                              backgroundColor:
                                pricingTier === "dealer"
                                  ? "hsl(0 84% 55%)"
                                  : pricingTier === "wholesale"
                                  ? "hsl(45 100% 51%)"
                                  : "hsl(142 71% 45%)",
                            }
                      }
                      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full p-[2px]"
                    >
                      <Avatar className="h-9 w-9">
                        {avatarUrl ? <AvatarImage src={avatarUrl} alt={fullName ?? user.email ?? ""} /> : null}
                        <AvatarFallback className="bg-gradient-brand text-[10px] font-bold text-primary-foreground">
                          {(fullName || user.email || "U").trim().slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {(isVerified || isAdmin) && (
                        <span
                          aria-label="verified"
                          className="absolute -bottom-0.5 -end-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-background"
                        >
                          <BadgeCheck
                            className="h-4 w-4"
                            style={{
                              color: isAdmin ? "hsl(45 95% 50%)" : "hsl(210 100% 50%)",
                              fill: isAdmin ? "hsl(45 95% 50%)" : "hsl(210 100% 50%)",
                              stroke: "hsl(0 0% 100%)",
                            }}
                          />
                        </span>
                      )}
                    </span>
                    {isAdmin && (
                      <span
                        className="hidden sm:inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black"
                        style={{
                          background: "linear-gradient(135deg, hsl(45 95% 65%), hsl(40 100% 50%))",
                          boxShadow: "0 1px 4px hsl(40 80% 30% / 0.4)",
                        }}
                      >
                        Admin
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl border-white/40 bg-white/80 backdrop-blur-2xl">
                  <DropdownMenuItem asChild>
                    <Link to="/account"><UserIcon className="me-2 h-4 w-4" />{t("my_account")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/tools"><Wrench className="me-2 h-4 w-4" />{lang === "ar" ? "الأدوات" : "Tools"}</Link>
                  </DropdownMenuItem>
                  {(isAdmin || isSales) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin"><ShieldCheck className="me-2 h-4 w-4" />{isAdmin ? t("admin_panel") : (lang === "ar" ? "لوحة التحكم" : "Dashboard")}</Link>
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
              <Button asChild size="sm" className="h-9 rounded-full bg-gradient-brand px-4 shadow-[0_4px_14px_-4px_hsl(217_91%_32%/0.5)]">
                <Link to="/auth">{t("sign_in")}</Link>
              </Button>
            )}

            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-white/60 md:hidden" onClick={() => setOpen(!open)}>
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {open && (
          <div className="mt-2 rounded-2xl border border-white/40 bg-white/70 p-2 backdrop-blur-2xl shadow-[0_10px_40px_-16px_hsl(217_91%_32%/0.25)] md:hidden animate-fade-in">
            <div className="flex flex-col">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end as any}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                      isActive ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:bg-white/60"
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
