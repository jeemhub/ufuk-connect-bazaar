import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";

// Public VAPID key (safe to expose). Private key is stored as a server secret.
const VAPID_PUBLIC_KEY = "BFz5sdAQts-WBOFV17OebqvvpkruP_EflR5pq2mZ_6oYKRKEGd-N6xxYXp3mxj9wa4JgvUnhXdlm3BlcbxsKv6s";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

export function usePushSubscription() {
  const { user } = useAuth();
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ok = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setSupported(ok);
    if (ok) setPermission(Notification.permission);
  }, []);

  // Detect existing subscription
  useEffect(() => {
    if (!supported) return;
    (async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration("/sw.js");
        const sub = await reg?.pushManager.getSubscription();
        setEnabled(!!sub);
      } catch {
        setEnabled(false);
      }
    })();
  }, [supported, user]);

  const enable = useCallback(async () => {
    if (!supported) return { ok: false, reason: "unsupported" as const };
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") return { ok: false, reason: "denied" as const };

      let reg = await navigator.serviceWorker.getRegistration("/sw.js");
      if (!reg) reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      const json = sub.toJSON() as any;
      const endpoint = sub.endpoint;
      const p256dh = json.keys?.p256dh;
      const authKey = json.keys?.auth;

      if (!endpoint || !p256dh || !authKey) return { ok: false, reason: "invalid" as const };

      // Upsert subscription
      await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
      const { error } = await supabase.from("push_subscriptions").insert({
        endpoint,
        p256dh,
        auth: authKey,
        user_id: user?.id ?? null,
        user_agent: navigator.userAgent,
      });
      if (error) return { ok: false, reason: "db" as const, error };
      setEnabled(true);
      return { ok: true as const };
    } catch (e) {
      return { ok: false, reason: "error" as const, error: e };
    } finally {
      setLoading(false);
    }
  }, [supported, user]);

  const disable = useCallback(async () => {
    if (!supported) return { ok: false };
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        await sub.unsubscribe();
      }
      setEnabled(false);
      return { ok: true };
    } finally {
      setLoading(false);
    }
  }, [supported]);

  return { supported, permission, enabled, loading, enable, disable };
}
