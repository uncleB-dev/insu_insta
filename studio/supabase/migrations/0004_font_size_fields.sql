-- ─────────────────────────────────────────────────────────────
-- 0004_font_size_fields.sql
-- design-font-size: 슬라이드별 폰트 크기 + 줄 간격
-- nullable → null 이면 SlideCanvas 가 레이아웃 기본값 사용
-- ─────────────────────────────────────────────────────────────

alter table public.slides
  add column if not exists main_font_size smallint,
  add column if not exists sub_font_size  smallint,
  add column if not exists line_height    numeric(3,2);

comment on column public.slides.main_font_size is
  '메인 텍스트 폰트 크기 (px). null = 레이아웃 기본값 (A/B=20, C=22, 그 외=28)';
comment on column public.slides.sub_font_size is
  '보조 텍스트 폰트 크기 (px). null = 레이아웃 기본값 (모든 레이아웃 13)';
comment on column public.slides.line_height is
  '메인+보조 텍스트 줄 간격. null = 레이아웃 기본값 (1.4)';

-- 안전 범위 체크 (UI 슬라이더 범위와 동일)
alter table public.slides
  add constraint slides_main_font_size_range
    check (main_font_size is null or (main_font_size between 8 and 96)),
  add constraint slides_sub_font_size_range
    check (sub_font_size is null or (sub_font_size between 6 and 48)),
  add constraint slides_line_height_range
    check (line_height is null or (line_height between 0.80 and 2.50));
