-- ─────────────────────────────────────────────────────────────
-- 0007_slide_header_multi_msg.sql
-- Posts: 좌상단 브랜드 머릿말 (텍스트 또는 이미지)
-- Slides: 대화형 레이아웃에서 한 슬라이드에 최대 4개 말풍선
-- ─────────────────────────────────────────────────────────────

-- 1. posts 머릿말
alter table public.posts
  add column if not exists header_text text,
  add column if not exists header_image_url text;

comment on column public.posts.header_text is
  '슬라이드 좌상단에 표시할 브랜드 머릿말 텍스트 (예: "보험삼촌의 보험 이야기")';
comment on column public.posts.header_image_url is
  '슬라이드 좌상단 머릿말 이미지 URL (있으면 텍스트보다 우선). public storage URL 권장';

-- 2. slides 다중 메시지 (main_text2/3/4 + speaker2/3/4)
alter table public.slides
  add column if not exists main_text2 text,
  add column if not exists main_text3 text,
  add column if not exists main_text4 text,
  add column if not exists speaker2 speaker_kind,
  add column if not exists speaker3 speaker_kind,
  add column if not exists speaker4 speaker_kind;

comment on column public.slides.main_text2 is
  '대화형 레이아웃(msg_left/msg_right)에서 두 번째 말풍선 텍스트 (선택)';
comment on column public.slides.main_text3 is
  '세 번째 말풍선 텍스트 (선택)';
comment on column public.slides.main_text4 is
  '네 번째 말풍선 텍스트 (선택)';
comment on column public.slides.speaker2 is
  '두 번째 말풍선의 화자 (niece=좌측 흰, uncle=우측 노란, none=좌측 흰)';
