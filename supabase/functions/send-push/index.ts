// Edge function: send-push
// Sends a Web Push notification to all subscriptions of a given user (or list of users).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import webpush from "https://esm.sh/web-push@3.6.7";

declare const Deno: any;

const VAPID_PUBLIC = "BGMK-tXOiEvz3KPkScSzeV24hv6P61UMdzKmQxggQ44wJBKbqkjrbo9KeZ7QmWgkO6dtw6cQVKP0sr1Gj5TpkMI";
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@example.com";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
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
        // Cleanup expired/invalid subscriptions
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", s.id);
        }
        return { id: s.id, ok: false, status: err?.statusCode };
      }
    }));

    const sent = results.filter((r) => r.status === "fulfilled" && (r.value as any).ok).length;
    return new Response(JSON.stringify({ sent, total: subs?.length ?? 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
