const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Result { url: string; thumb: string; credit: string; source: string }

async function fromUnsplash(query: string, key: string): Promise<Result[]> {
  const res = await fetch(
    `https://api.unsplash.com/search/photos?per_page=8&orientation=squarish&query=${encodeURIComponent(query)}`,
    { headers: { Authorization: `Client-ID ${key}` } },
  );
  if (!res.ok) throw new Error(`Unsplash ${res.status}`);
  const json = await res.json();
  return (json.results ?? []).map((p: any) => ({
    url: p.urls?.regular ?? p.urls?.full,
    thumb: p.urls?.small ?? p.urls?.thumb,
    credit: p.user?.name ?? "Unsplash",
    source: "unsplash",
  }));
}

async function fromOpenverse(query: string): Promise<Result[]> {
  const res = await fetch(
    `https://api.openverse.org/v1/images/?page_size=8&license_type=commercial&q=${encodeURIComponent(query)}`,
    { headers: { "User-Agent": "ufuk-albasra/1.0" } },
  );
  if (!res.ok) throw new Error(`Openverse ${res.status}`);
  const json = await res.json();
  return (json.results ?? []).map((p: any) => ({
    url: p.url,
    thumb: p.thumbnail ?? p.url,
    credit: p.creator ?? "Openverse",
    source: "openverse",
  }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { query } = await req.json();
    const q = String(query ?? "").trim();
    if (!q) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const key = Deno.env.get("UNSPLASH_ACCESS_KEY");
    let results: Result[] = [];
    if (key) {
      try { results = await fromUnsplash(q, key); } catch (_) { /* fall through */ }
    }
    if (!results.length) {
      try { results = await fromOpenverse(q); } catch (_) { /* ignore */ }
    }
    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e), results: [] }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
