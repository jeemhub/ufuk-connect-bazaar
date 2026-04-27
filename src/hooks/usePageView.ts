import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

function deviceFromUA(ua: string): string {
  if (/Mobi|Android|iPhone/.test(ua)) return "mobile";
  if (/iPad|Tablet/.test(ua)) return "tablet";
  return "desktop";
}

/** Records a page visit on every route change. Anonymous-friendly. */
export function usePageView() {
  const location = useLocation();
  useEffect(() => {
    const ua = navigator.userAgent || "";
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? null;
      await supabase.from("page_visits").insert({
        user_id: uid,
        path: location.pathname,
        referrer: document.referrer || null,
        user_agent: ua.slice(0, 500),
        device: deviceFromUA(ua),
      });
    })();
  }, [location.pathname]);
}
