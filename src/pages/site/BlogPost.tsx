import { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Heart, Share2, Trash2, Reply, X } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePost } from "@/hooks/useBlog";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type Comment = {
  id: string;
  body: string;
  user_id: string;
  created_at: string;
  parent_id: string | null;
  profile?: { full_name: string | null } | null;
};

export default function BlogPostPage() {
  const { slug } = useParams();
  const { t, lang } = useLanguage();
  const { user, isAdmin } = useAuth();
  const { post, loading } = usePost(slug);

  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);

  const loadEngagement = useCallback(async (postId: string) => {
    const { count } = await supabase.from("blog_likes").select("*", { count: "exact", head: true }).eq("post_id", postId);
    setLikes(count ?? 0);
    if (user) {
      const { data } = await supabase.from("blog_likes").select("post_id").eq("post_id", postId).eq("user_id", user.id).maybeSingle();
      setLiked(!!data);
    } else setLiked(false);

    const { data: cs } = await supabase
      .from("blog_comments")
      .select("id, body, user_id, created_at")
      .eq("post_id", postId)
      .order("created_at", { ascending: false });
    setComments((cs ?? []) as Comment[]);
  }, [user]);

  useEffect(() => {
    if (!post) return;
    document.title = `${lang === "ar" ? post.title_ar : post.title_en} — ${t("brand")}`;
    loadEngagement(post.id);
  }, [post, loadEngagement, lang, t]);

  const toggleLike = async () => {
    if (!user) return toast.error(t("blog_login_to_comment"));
    if (!post) return;
    if (liked) {
      await supabase.from("blog_likes").delete().eq("post_id", post.id).eq("user_id", user.id);
    } else {
      await supabase.from("blog_likes").insert({ post_id: post.id, user_id: user.id });
    }
    loadEngagement(post.id);
  };

  const share = async () => {
    const url = window.location.href;
    const title = post ? (lang === "ar" ? post.title_ar : post.title_en) : "";
    if (navigator.share) {
      try { await navigator.share({ title, url }); return; } catch { /* ignore */ }
    }
    await navigator.clipboard.writeText(url);
    toast.success(t("blog_link_copied"));
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !post || !commentText.trim()) return;
    setPosting(true);
    const { error } = await supabase.from("blog_comments").insert({
      post_id: post.id,
      user_id: user.id,
      body: commentText.trim(),
    });
    setPosting(false);
    if (error) return toast.error(error.message);
    setCommentText("");
    loadEngagement(post.id);
  };

  const deleteComment = async (id: string) => {
    await supabase.from("blog_comments").delete().eq("id", id);
    if (post) loadEngagement(post.id);
  };

  if (loading) {
    return <div className="mx-auto max-w-3xl px-4 py-10"><Skeleton className="h-96 w-full" /></div>;
  }
  if (!post) {
    return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-muted-foreground">404</div>;
  }

  const title = lang === "ar" ? post.title_ar : post.title_en;
  const body = lang === "ar" ? post.body_ar : post.body_en;

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft className="h-4 w-4" /> {t("blog_back")}
      </Link>

      {post.cover_url && (
        <img src={post.cover_url} alt={title} className="w-full aspect-video object-cover rounded-lg mb-6" />
      )}

      <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mb-3">{title}</h1>
      <div className="text-sm text-muted-foreground mb-6">
        {new Date(post.published_at ?? post.created_at).toLocaleDateString(lang === "ar" ? "ar" : "en")}
      </div>

      <div className="prose prose-lg max-w-none whitespace-pre-wrap text-foreground/90 leading-relaxed">
        {body}
      </div>

      <div className="mt-10 flex items-center gap-3 border-t border-b py-4">
        <Button variant={liked ? "default" : "outline"} size="sm" onClick={toggleLike} className="gap-2">
          <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
          {likes} {t("blog_likes")}
        </Button>
        <Button variant="outline" size="sm" onClick={share} className="gap-2">
          <Share2 className="h-4 w-4" /> {t("blog_share")}
        </Button>
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-bold mb-4">{t("blog_comments")} ({comments.length})</h2>

        {user ? (
          <form onSubmit={submitComment} className="mb-6 space-y-2">
            <Textarea value={commentText} onChange={(e) => setCommentText(e.target.value)}
              placeholder={t("blog_comment_placeholder")} rows={3} maxLength={2000} />
            <Button type="submit" disabled={posting || !commentText.trim()} size="sm">
              {t("blog_post_comment")}
            </Button>
          </form>
        ) : (
          <div className="mb-6 rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            <Link to="/auth" className="text-primary hover:underline">{t("blog_login_to_comment")}</Link>
          </div>
        )}

        <div className="space-y-4">
          {comments.map((c) => (
            <div key={c.id} className="surface-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                </div>
                {(user?.id === c.user_id || isAdmin) && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteComment(c.id)} aria-label={t("blog_delete")}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              <div className="mt-2 whitespace-pre-wrap text-sm">{c.body}</div>
            </div>
          ))}
          {comments.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-6">—</div>
          )}
        </div>
      </section>
    </article>
  );
}
