-- ─────────────────────────────────────────────────────────────
-- 0009_inset_images.sql
-- 디자인 단계의 카드별 보조 이미지 (배경과 별개로 작은 일러스트/아이콘 삽입)
-- ─────────────────────────────────────────────────────────────

alter table public.slides
  add column if not exists inset_image_url text,
  add column if not exists inset_image_pos text,
  add column if not exists inset_image_size text;

-- check 제약
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'slides_inset_image_pos_check'
  ) then
    alter table public.slides
      add constraint slides_inset_image_pos_check
      check (
        inset_image_pos is null or
        inset_image_pos in ('top_left','top_right','bottom_left','bottom_right','center')
      );
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'slides_inset_image_size_check'
  ) then
    alter table public.slides
      add constraint slides_inset_image_size_check
      check (
        inset_image_size is null or
        inset_image_size in ('small','medium','large')
      );
end if;
end $$;

comment on column public.slides.inset_image_url is
  '카드 안에 작은 보조 이미지 URL (일러스트/아이콘). null = 표시 안 함';
comment on column public.slides.inset_image_pos is
  '보조 이미지 위치: top_left / top_right / bottom_left / bottom_right / center';
comment on column public.slides.inset_image_size is
  '보조 이미지 크기: small (72px) / medium (120px) / large (168px)';
