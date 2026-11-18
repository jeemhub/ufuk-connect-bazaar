import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type BlogPost = {
  id: string;
  slug: string;
  title_en: string;
  title_ar: string;
  excerpt_en: string | null;
  excerpt_ar: string | null;
  body_en: string | null;
  body_ar: string | null;
  cover_url: string | null;
  status: string;
  is_featured: boolean;
  featured_sort: number;
  view_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

const SUMMARY_COLUMNS = "id,slug,title_en,title_ar,excerpt_en,excerpt_ar,cover_url,status,is_featured,featured_sort,view_count,published_at,created_at,updated_at";
export function usePublishedPosts() {
  const query = useQuery({ queryKey: ["blog", "published"], staleTime: 300_000, retry: false, queryFn: async () => {
    const { data, error } = await supabase.from("blog_posts").select(SUMMARY_COLUMNS).eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as BlogPost[];
  } });
  return { posts: query.data ?? [], loading: query.isPending, refresh: query.refetch };
}

export function useFeaturedPosts() {
  const query = useQuery({ queryKey: ["blog", "featured"], staleTime: 300_000, retry: false, queryFn: async () => {
    const { data, error } = await supabase.from("blog_posts").select(SUMMARY_COLUMNS).eq("status", "published")
      .eq("is_featured", true).order("featured_sort", { ascending: true }).limit(10);
    if (error) throw error;
    return (data ?? []) as BlogPost[];
  } });
  return query.data ?? [];
}

export function usePost(slug: string | undefined) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setPost(null);
    if (!slug) {
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error("usePost error:", error);
        setPost((data as BlogPost) ?? null);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [slug]);

  return { post, loading };
}

export function useAllPostsAdmin() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false });
    setPosts((data ?? []) as BlogPost[]);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  return { posts, loading, refresh };
}
