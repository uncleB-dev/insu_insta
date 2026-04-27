-- ─────────────────────────────────────────────────────────────
-- 0001_initial.sql
-- 보험삼촌 BEN's Studio — initial schema
-- ─────────────────────────────────────────────────────────────

-- ─── Extensions ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Enums ───────────────────────────────────────────────────
create type series_kind        as enum ('A', 'B', 'C');
create type persona_kind       as enum ('30s_office', 'newbie', 'parent', 'newlywed');
create type post_status        as enum ('draft', 'scheduled', 'published');
create type principle_kind     as enum ('hook', 'problem', 'solution', 'doubt', 'scarcity', 'cta');
create type speaker_kind       as enum ('niece', 'uncle', 'none');
create type guard_level        as enum ('red', 'yellow', 'green');
create type guard_rule_kind    as enum ('word', 'regex');
create type hashtag_category   as enum ('brand', 'topic', 'target', 'general');
create type photo_source       as enum ('upload', 'unsplash', 'library');

-- ─── profiles (Supabase Auth 보강) ───────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  display_name text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── posts ───────────────────────────────────────────────────
create table public.posts (
  id          uuid primary key default uuid_generate_v4(),
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  series      series_kind not null,
  persona     persona_kind not null,
  status      post_status not null default 'draft',
  topic       text,
  facts       text,
  tone        text,
  cta_kind    text,
  caption     text,
  schedule_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index posts_owner_idx on public.posts(owner_id);
create index posts_status_idx on public.posts(status);

-- ─── slides (post 1:N) ───────────────────────────────────────
create table public.slides (
  id         uuid primary key default uuid_generate_v4(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  ord        smallint not null,
  principle  principle_kind not null,
  speaker    speaker_kind not null default 'none',
  scene      text,
  main_text  text not null,
  sub_text   text,
  emphasis   text[] not null default '{}',
  layout     text default 'A',
  bg_photo_id uuid,
  blur       smallint not null default 0,
  overlay    smallint not null default 50,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (post_id, ord)
);
create index slides_post_idx on public.slides(post_id);

-- ─── hashtags (post 1:N) ─────────────────────────────────────
create table public.hashtags (
  id        uuid primary key default uuid_generate_v4(),
  post_id   uuid not null references public.posts(id) on delete cascade,
  category  hashtag_category not null,
  tag       text not null,
  created_at timestamptz not null default now(),
  unique (post_id, category, tag)
);
create index hashtags_post_idx on public.hashtags(post_id);

-- ─── guardrail_rules (글로벌, admin 관리) ───────────────────
create table public.guardrail_rules (
  id         uuid primary key default uuid_generate_v4(),
  level      guard_level not null,
  kind       guard_rule_kind not null,
  pattern    text not null,
  message    text not null,
  replace_with text,
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index guardrail_active_idx on public.guardrail_rules(active);

-- ─── prompts + prompt_versions ───────────────────────────────
create table public.prompts (
  id          uuid primary key default uuid_generate_v4(),
  slug        text not null unique,
  title       text not null,
  description text,
  active_version_id uuid,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.prompt_versions (
  id         uuid primary key default uuid_generate_v4(),
  prompt_id  uuid not null references public.prompts(id) on delete cascade,
  version    text not null,
  body       text not null,
  author     text,
  created_at timestamptz not null default now(),
  unique (prompt_id, version)
);

alter table public.prompts
  add constraint prompts_active_version_fk
  foreign key (active_version_id) references public.prompt_versions(id) on delete set null;

-- ─── library_photos (글로벌 라이브러리) ─────────────────────
create table public.library_photos (
  id         uuid primary key default uuid_generate_v4(),
  src        text not null,
  source     photo_source not null default 'library',
  uses       integer not null default 0,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ─── guardrail_hits (slide 1:N, 캐싱용) ─────────────────────
create table public.guardrail_hits (
  id         uuid primary key default uuid_generate_v4(),
  slide_id   uuid not null references public.slides(id) on delete cascade,
  rule_id    uuid references public.guardrail_rules(id) on delete set null,
  level      guard_level not null,
  word       text not null,
  suggest    text,
  created_at timestamptz not null default now()
);
create index guardrail_hits_slide_idx on public.guardrail_hits(slide_id);

-- ─────────────────────────────────────────────────────────────
-- Triggers — updated_at 자동 갱신
-- ─────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at        before update on public.profiles        for each row execute function public.set_updated_at();
create trigger trg_posts_updated_at           before update on public.posts           for each row execute function public.set_updated_at();
create trigger trg_slides_updated_at          before update on public.slides          for each row execute function public.set_updated_at();
create trigger trg_guardrail_rules_updated_at before update on public.guardrail_rules for each row execute function public.set_updated_at();
create trigger trg_prompts_updated_at         before update on public.prompts         for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Auth 사용자 생성 시 profiles 자동 insert
-- ─────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────

-- profiles
alter table public.profiles enable row level security;

create policy "profiles_self_read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_self_update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- posts
alter table public.posts enable row level security;

create policy "posts_owner_select"
  on public.posts for select
  using (auth.uid() = owner_id);

create policy "posts_owner_insert"
  on public.posts for insert
  with check (auth.uid() = owner_id);

create policy "posts_owner_update"
  on public.posts for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "posts_owner_delete"
  on public.posts for delete
  using (auth.uid() = owner_id);

-- slides (post.owner_id 통해 권한)
alter table public.slides enable row level security;

create policy "slides_owner_all"
  on public.slides for all
  using (
    exists (select 1 from public.posts p where p.id = slides.post_id and p.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.posts p where p.id = slides.post_id and p.owner_id = auth.uid())
  );

-- hashtags
alter table public.hashtags enable row level security;

create policy "hashtags_owner_all"
  on public.hashtags for all
  using (
    exists (select 1 from public.posts p where p.id = hashtags.post_id and p.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.posts p where p.id = hashtags.post_id and p.owner_id = auth.uid())
  );

-- guardrail_hits
alter table public.guardrail_hits enable row level security;

create policy "guardrail_hits_owner_all"
  on public.guardrail_hits for all
  using (
    exists (
      select 1 from public.slides s
      join public.posts p on p.id = s.post_id
      where s.id = guardrail_hits.slide_id and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.slides s
      join public.posts p on p.id = s.post_id
      where s.id = guardrail_hits.slide_id and p.owner_id = auth.uid()
    )
  );

-- guardrail_rules — 인증된 사용자는 read OK, 변경은 service_role
alter table public.guardrail_rules enable row level security;

create policy "guardrail_rules_authed_read"
  on public.guardrail_rules for select
  to authenticated
  using (true);

-- prompts / prompt_versions — 인증된 사용자는 read OK
alter table public.prompts enable row level security;
create policy "prompts_authed_read"
  on public.prompts for select
  to authenticated
  using (true);

alter table public.prompt_versions enable row level security;
create policy "prompt_versions_authed_read"
  on public.prompt_versions for select
  to authenticated
  using (true);

-- library_photos — 인증된 사용자는 read OK, 본인 업로드는 owner CRUD
alter table public.library_photos enable row level security;

create policy "library_photos_authed_read"
  on public.library_photos for select
  to authenticated
  using (true);

create policy "library_photos_owner_insert"
  on public.library_photos for insert
  with check (auth.uid() = uploaded_by);

create policy "library_photos_owner_delete"
  on public.library_photos for delete
  using (auth.uid() = uploaded_by);
