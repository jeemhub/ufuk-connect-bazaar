// Edge function: send-push
// Sends a Web Push notification to all subscriptions of a given user (or list of users).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import webpush from "https://esm.sh/web-push@3.6.7";

declare const Deno: any;

const VAPID_PUBLIC = "BFz5sdAQts-WBOFV17OebqvvpkruP_EflR5pq2mZ_6oYKRKEGd-N6xxYXp3mxj9wa4JgvUnhXdlm3BlcbxsKv6s";
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const RAW_SUBJECT = (Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@example.com").trim();
// Normalize: must be a valid URL (mailto: or https:)
function normalizeSubject(s: string): string {
  if (!s) return "mailto:admin@example.com";
  if (s.startsWith("mailto:") || s.startsWith("https://") || s.startsWith("http://")) return s;
  if (s.includes("@")) return `mailto:${s}`;
  return `https://${s}`;
}
const VAPID_SUBJECT = normalizeSubject(RAW_SUBJECT);

if (VAPID_PRIVATE) {
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  } catch (e) {
    console.error("setVapidDetails failed:", e);
  }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!VAPID_PRIVATE) {
      return new Response(JSON.stringify({ error: "VAPID_PRIVATE_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { user_ids, broadcast, title, body, link, tag } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let query = supabase.from("push_subscriptions").select("id, endpoint, p256dh, auth, user_id");
    if (!broadcast) {
      if (!Array.isArray(user_ids) || user_ids.length === 0) {
        return new Response(JSON.stringify({ error: "user_ids required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      query = query.in("user_id", user_ids);
    }

    const { data: subs, error } = await query;
    if (error) throw error;

    const payload = JSON.stringify({ title, body, link, tag });
    const results = await Promise.allSettled((subs ?? []).map(async (s: any) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        );
        return { id: s.id, ok: true };
      } catch (err: any) {
        console.error("push fail", { id: s.id, status: err?.statusCode, body: err?.body, msg: err?.message });
        if (err?.statusCode === 404 || err?.statusCode === 410 || err?.statusCode === 403) {
          await supabase.from("push_subscriptions").delete().eq("id", s.id);
        }
        return { id: s.id, ok: false, status: err?.statusCode, body: err?.body };
      }
    }));

    const details = results.map((r) => r.status === "fulfilled" ? r.value : { ok: false, error: String(r.reason) });
    const sent = results.filter((r) => r.status === "fulfilled" && (r.value as any).ok).length;
    return new Response(JSON.stringify({ sent, total: subs?.length ?? 0, details, subject: VAPID_SUBJECT }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
