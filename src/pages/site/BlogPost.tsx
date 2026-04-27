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
import { TierAvatar } from "@/components/site/TierAvatar";

type Tier = "dealer" | "wholesale" | "retail";
type Profile = { full_name: string | null; avatar_url: string | null; is_verified: boolean; tier: Tier };

type Comment = {
  id: string;
  body: string;
  user_id: string;
  created_at: string;
  parent_id: string | null;
};

export default function BlogPostPage() {
  const { slug } = useParams();
  const { t, lang } = useLanguage();
  const { user, isAdmin } = useAuth();
  const { post, loading } = usePost(slug);

  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const loadEngagement = useCallback(async (postId: string) => {
    const { count } = await supabase.from("blog_likes").select("*", { count: "exact", head: true }).eq("post_id", postId);
    setLikes(count ?? 0);
    if (user) {
      const { data } = await supabase.from("blog_likes").select("post_id").eq("post_id", postId).eq("user_id", user.id).maybeSingle();
      setLiked(!!data);
    } else setLiked(false);

    const { data: cs } = await supabase
      .from("blog_comments")
      .select("id, body, user_id, created_at, parent_id")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    const list = (cs ?? []) as Comment[];
    setComments(list);

    const userIds = Array.from(new Set(list.map((c) => c.user_id)));
    if (userIds.length > 0) {
      const [{ data: profs }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, avatar_url, is_verified").in("id", userIds),
        supabase.from("user_roles").select("user_id, role").in("user_id", userIds),
      ]);
      const tierByUser: Record<string, Tier> = {};
      (roles ?? []).forEach((r: any) => {
        const cur = tierByUser[r.user_id];
        if (r.role === "dealer") tierByUser[r.user_id] = "dealer";
        else if (r.role === "wholesale" && cur !== "dealer") tierByUser[r.user_id] = "wholesale";
        else if (!cur) tierByUser[r.user_id] = "retail";
      });
      const map: Record<string, Profile> = {};
      (profs ?? []).forEach((p: any) => {
        map[p.id] = {
          full_name: p.full_name,
          avatar_url: p.avatar_url,
          is_verified: Boolean(p.is_verified),
          tier: tierByUser[p.id] ?? "retail",
        };
      });
      setProfiles(map);
    } else {
      setProfiles({});
    }
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
      parent_id: null,
    });
    setPosting(false);
    if (error) return toast.error(error.message);
    setCommentText("");
    loadEngagement(post.id);
  };

  const submitReply = async (parentId: string) => {
    if (!user || !post || !replyText.trim()) return;
    setPosting(true);
    const { error } = await supabase.from("blog_comments").insert({
      post_id: post.id,
      user_id: user.id,
      body: replyText.trim(),
      parent_id: parentId,
    });
    setPosting(false);
    if (error) return toast.error(error.message);
    setReplyText("");
    setReplyTo(null);
    loadEngagement(post.id);
  };

  const deleteComment = async (id: string) => {
    await supabase.from("blog_comments").delete().eq("id", id);
    if (post) loadEngagement(post.id);
  };

  const { roots, repliesByParent } = useMemo(() => {
    const roots: Comment[] = [];
    const repliesByParent = new Map<string, Comment[]>();
    for (const c of comments) {
      if (c.parent_id) {
        const arr = repliesByParent.get(c.parent_id) ?? [];
        arr.push(c);
        repliesByParent.set(c.parent_id, arr);
      } else {
        roots.push(c);
      }
    }
    // newest roots first
    roots.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    return { roots, repliesByParent };
  }, [comments]);

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
          {roots.map((c) => {
            const replies = repliesByParent.get(c.id) ?? [];
            const isReplying = replyTo === c.id;
            return (
              <div key={c.id} className="surface-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <TierAvatar
                      src={profiles[c.user_id]?.avatar_url}
                      name={profiles[c.user_id]?.full_name}
                      tier={profiles[c.user_id]?.tier}
                      verified={profiles[c.user_id]?.is_verified}
                      size="md"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {profiles[c.user_id]?.full_name?.trim() || (lang === "ar" ? "مستخدم" : "User")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  {(user?.id === c.user_id || isAdmin) && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteComment(c.id)} aria-label={t("blog_delete")}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <div className="mt-3 whitespace-pre-wrap text-sm">{c.body}</div>

                <div className="mt-3 flex items-center gap-2">
                  {user && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs gap-1"
                      onClick={() => { setReplyTo(isReplying ? null : c.id); setReplyText(""); }}
                    >
                      {isReplying ? <X className="h-3.5 w-3.5" /> : <Reply className="h-3.5 w-3.5" />}
                      {isReplying ? (lang === "ar" ? "إلغاء" : "Cancel") : (lang === "ar" ? "رد" : "Reply")}
                    </Button>
                  )}
                  {replies.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {replies.length} {lang === "ar" ? "ردود" : "replies"}
                    </span>
                  )}
                </div>

                {isReplying && (
                  <div className="mt-3 space-y-2">
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={lang === "ar" ? "اكتب ردك..." : "Write your reply..."}
                      rows={2}
                      maxLength={2000}
                    />
                    <Button size="sm" disabled={posting || !replyText.trim()} onClick={() => submitReply(c.id)}>
                      {lang === "ar" ? "إرسال الرد" : "Post reply"}
                    </Button>
                  </div>
                )}

                {replies.length > 0 && (
                  <div className="mt-4 space-y-3 ms-4 ps-4 border-s border-border">
                    {replies.map((r) => (
                      <div key={r.id} className="rounded-lg bg-muted/40 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <TierAvatar
                              src={profiles[r.user_id]?.avatar_url}
                              name={profiles[r.user_id]?.full_name}
                              tier={profiles[r.user_id]?.tier}
                              verified={profiles[r.user_id]?.is_verified}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-medium truncate">
                                {profiles[r.user_id]?.full_name?.trim() || (lang === "ar" ? "مستخدم" : "User")}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                              </div>
                            </div>
                          </div>
                          {(user?.id === r.user_id || isAdmin) && (
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteComment(r.id)} aria-label={t("blog_delete")}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <div className="mt-2 whitespace-pre-wrap text-sm">{r.body}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {roots.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-6">—</div>
          )}
        </div>
      </section>
    </article>
  );
}
