-- ─────────────────────────────────────────────────────────────
-- 0003_design_fields_and_storage.sql
-- 디자인 단계용 슬라이드 컬럼 추가 + Storage 버킷 생성
-- ─────────────────────────────────────────────────────────────

-- ─── 1. slides 테이블 컬럼 추가 ──────────────────────────────
alter table public.slides
  add column if not exists text_pos     text not null default 'mid',
  add column if not exists accent_color text not null default 'green';

comment on column public.slides.text_pos     is 'top | mid | bot';
comment on column public.slides.accent_color is 'green | yellow | red | white';

-- bg_photo_id가 library_photos를 참조하도록 FK 보강
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'slides_bg_photo_fk'
  ) then
    alter table public.slides
      add constraint slides_bg_photo_fk
      foreign key (bg_photo_id) references public.library_photos(id) on delete set null;
  end if;
end $$;

-- ─── 2. Storage 버킷 생성 (library) ──────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'library',
  'library',
  true, -- public read (slide 배경으로 사용)
  10485760, -- 10MB
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
  set public = true,
      file_size_limit = 10485760,
      allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp'];

-- ─── 3. Storage RLS 정책 ─────────────────────────────────────
-- 버킷이 public이라 read는 anon에도 OK (slide 배경 표시용)
-- write는 인증된 사용자만

drop policy if exists "library_read"   on storage.objects;
drop policy if exists "library_write"  on storage.objects;
drop policy if exists "library_update" on storage.objects;
drop policy if exists "library_delete" on storage.objects;

create policy "library_read"
  on storage.objects for select
  using (bucket_id = 'library');

create policy "library_write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'library');

create policy "library_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'library')
  with check (bucket_id = 'library');

create policy "library_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'library');
