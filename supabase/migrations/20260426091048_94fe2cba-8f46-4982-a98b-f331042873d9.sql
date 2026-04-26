
-- ============ BLOG POSTS ============
create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_en text not null,
  title_ar text not null,
  excerpt_en text,
  excerpt_ar text,
  body_en text,
  body_ar text,
  cover_url text,
  author_id uuid,
  status text not null default 'draft', -- draft | published
  is_featured boolean not null default false,
  featured_sort int not null default 0,
  view_count int not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_blog_posts_status on public.blog_posts(status);
create index idx_blog_posts_featured on public.blog_posts(is_featured, featured_sort);

alter table public.blog_posts enable row level security;

create policy "Posts: public read published"
on public.blog_posts for select
to anon, authenticated
using (status = 'published' or has_role(auth.uid(), 'admin'));

create policy "Posts: admin write"
on public.blog_posts for all
to authenticated
using (has_role(auth.uid(), 'admin'))
with check (has_role(auth.uid(), 'admin'));

create trigger trg_blog_posts_updated
before update on public.blog_posts
for each row execute function public.set_updated_at();

-- ============ COMMENTS ============
create table public.blog_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.blog_posts(id) on delete cascade,
  user_id uuid not null,
  parent_id uuid references public.blog_comments(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_blog_comments_post on public.blog_comments(post_id);

alter table public.blog_comments enable row level security;

create policy "Comments: public read"
on public.blog_comments for select
to anon, authenticated
using (
  exists (select 1 from public.blog_posts p
    where p.id = post_id and (p.status = 'published' or has_role(auth.uid(),'admin')))
);

create policy "Comments: signed-in insert"
on public.blog_comments for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (select 1 from public.blog_posts p where p.id = post_id and p.status = 'published')
);

create policy "Comments: own update"
on public.blog_comments for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Comments: own or admin delete"
on public.blog_comments for delete
to authenticated
using (user_id = auth.uid() or has_role(auth.uid(),'admin'));

create trigger trg_blog_comments_updated
before update on public.blog_comments
for each row execute function public.set_updated_at();

-- ============ LIKES ============
create table public.blog_likes (
  post_id uuid not null references public.blog_posts(id) on delete cascade,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.blog_likes enable row level security;

create policy "Likes: public read"
on public.blog_likes for select
to anon, authenticated
using (true);

create policy "Likes: own insert"
on public.blog_likes for insert
to authenticated
with check (user_id = auth.uid());

create policy "Likes: own delete"
on public.blog_likes for delete
to authenticated
using (user_id = auth.uid());

-- ============ NOTIFICATIONS ============
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type text not null default 'info',
  title text not null,
  body text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_notifications_user on public.notifications(user_id, is_read, created_at desc);

alter table public.notifications enable row level security;

create policy "Notif: own read"
on public.notifications for select
to authenticated
using (user_id = auth.uid());

create policy "Notif: own update"
on public.notifications for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Notif: own delete"
on public.notifications for delete
to authenticated
using (user_id = auth.uid());

create policy "Notif: admin insert"
on public.notifications for insert
to authenticated
with check (has_role(auth.uid(), 'admin'));

alter publication supabase_realtime add table public.notifications;

-- ============ PUSH SUBSCRIPTIONS ============
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);
create index idx_push_subs_user on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

create policy "Push: own select"
on public.push_subscriptions for select
to authenticated
using (user_id = auth.uid() or has_role(auth.uid(),'admin'));

create policy "Push: own insert"
on public.push_subscriptions for insert
to authenticated, anon
with check (
  (auth.uid() is null and user_id is null)
  or (auth.uid() is not null and user_id = auth.uid())
);

create policy "Push: own delete"
on public.push_subscriptions for delete
to authenticated
using (user_id = auth.uid() or has_role(auth.uid(),'admin'));

-- ============ STORAGE BUCKET FOR BLOG IMAGES ============
insert into storage.buckets (id, name, public) values ('blog-images','blog-images', true)
on conflict (id) do nothing;

create policy "Blog images public read"
on storage.objects for select
using (bucket_id = 'blog-images');

create policy "Blog images admin write"
on storage.objects for insert
to authenticated
with check (bucket_id = 'blog-images' and has_role(auth.uid(),'admin'));

create policy "Blog images admin update"
on storage.objects for update
to authenticated
using (bucket_id = 'blog-images' and has_role(auth.uid(),'admin'));

create policy "Blog images admin delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'blog-images' and has_role(auth.uid(),'admin'));

-- ============ HELPER: notify all users when a published post is created ============
create or replace function public.notify_users_on_new_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT' and new.status = 'published')
     or (tg_op = 'UPDATE' and new.status = 'published' and coalesce(old.status,'') <> 'published') then
    insert into public.notifications (user_id, type, title, body, link)
    select p.id, 'new_post',
           'مقال جديد: ' || new.title_ar,
           coalesce(new.excerpt_ar, left(coalesce(new.body_ar,''), 140)),
           '/blog/' || new.slug
    from public.profiles p;
  end if;
  return new;
end;
$$;

create trigger trg_notify_new_post
after insert or update of status on public.blog_posts
for each row execute function public.notify_users_on_new_post();
