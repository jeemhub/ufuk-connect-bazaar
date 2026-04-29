import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type PricingTier = "dealer" | "wholesale" | "retail";

export type SalesPermissions = {
  can_manage_products: boolean;
  can_manage_categories: boolean;
  can_manage_brands: boolean;
  can_manage_blog: boolean;
  can_manage_projects: boolean;
  can_manage_orders: boolean;
  can_manage_quotes: boolean;
};

const EMPTY_PERMS: SalesPermissions = {
  can_manage_products: false,
  can_manage_categories: false,
  can_manage_brands: false,
  can_manage_blog: false,
  can_manage_projects: false,
  can_manage_orders: false,
  can_manage_quotes: false,
};

type Ctx = {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  isSales: boolean;
  isStaff: boolean; // admin OR sales (can enter /admin)
  salesPerms: SalesPermissions;
  isBlocked: boolean;
  pricingTier: PricingTier;
  avatarUrl: string | null;
  fullName: string | null;
  isVerified: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<Ctx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSales, setIsSales] = useState(false);
  const [salesPerms, setSalesPerms] = useState<SalesPermissions>(EMPTY_PERMS);
  const [isBlocked, setIsBlocked] = useState(false);
  const [pricingTier, setPricingTier] = useState<PricingTier>("retail");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfileAndRoles = useCallback(async (userId: string) => {
    const [{ data: roles }, { data: profile }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("profiles").select("avatar_url, full_name, is_verified, is_blocked" as "*").eq("id", userId).maybeSingle(),
    ]);
    const roleNames = (roles ?? []).map((r) => String(r.role));
    const admin = roleNames.includes("admin");
    const sales = roleNames.includes("sales");
    setIsAdmin(admin);
    setIsSales(sales);
    if (roleNames.includes("dealer")) setPricingTier("dealer");
    else if (roleNames.includes("wholesale")) setPricingTier("wholesale");
    else setPricingTier("retail");
    const p = profile as unknown as { avatar_url?: string | null; full_name?: string | null; is_verified?: boolean; is_blocked?: boolean } | null;
    setAvatarUrl(p?.avatar_url ?? null);
    setFullName(p?.full_name ?? null);
    setIsVerified(Boolean(p?.is_verified));
    setIsBlocked(Boolean(p?.is_blocked));

    if (sales && !admin) {
      const { data: perms } = await (supabase.rpc as unknown as (
        fn: string,
      ) => Promise<{ data: SalesPermissions | null }>)("get_my_sales_permissions");
      setSalesPerms({ ...EMPTY_PERMS, ...(perms ?? {}) });
    } else {
      setSalesPerms(EMPTY_PERMS);
    }
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        setTimeout(() => fetchProfileAndRoles(s.user.id), 0);
      } else {
        setIsAdmin(false);
        setIsSales(false);
        setSalesPerms(EMPTY_PERMS);
        setIsBlocked(false);
        setPricingTier("retail");
        setAvatarUrl(null);
        setFullName(null);
        setIsVerified(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) fetchProfileAndRoles(s.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, [fetchProfileAndRoles]);

  const refreshProfile = useCallback(async () => {
    if (session?.user) await fetchProfileAndRoles(session.user.id);
  }, [session, fetchProfileAndRoles]);

  async function signOut() {
    if (session?.user) {
      await supabase.from("login_activity").insert({
        user_id: session.user.id,
        email: session.user.email,
        event: "logout",
        success: true,
        user_agent: navigator.userAgent,
      });
    }
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        isAdmin,
        isSales,
        isStaff: isAdmin || isSales,
        salesPerms,
        isBlocked,
        pricingTier,
        avatarUrl,
        fullName,
        isVerified,
        loading,
        refreshProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
