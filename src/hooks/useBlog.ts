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

export function usePublishedPosts() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
    setPosts((data ?? []) as BlogPost[]);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  return { posts, loading, refresh };
}

export function useFeaturedPosts() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  useEffect(() => {
    supabase
      .from("blog_posts")
      .select("*")
      .eq("status", "published")
      .eq("is_featured", true)
      .order("featured_sort", { ascending: true })
      .limit(10)
      .then(({ data }) => setPosts((data ?? []) as BlogPost[]));
  }, []);
  return posts;
}

export function usePost(slug: string | undefined) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => {
        setPost((data as BlogPost) ?? null);
        setLoading(false);
      });
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
