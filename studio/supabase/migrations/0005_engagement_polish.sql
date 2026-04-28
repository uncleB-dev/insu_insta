-- ─────────────────────────────────────────────────────────────
-- 0005_engagement_polish.sql
-- engagement-polish:
--   1. posts.reward_link  — 댓글 유도 CTA에서 댓글 단 사람에게 보낼 자료/링크
--   2. cta_kind 값 'comment_link' 허용 (text 컬럼이라 enum 변경 불필요,
--      check constraint만 추가하여 안전성 확보)
-- ─────────────────────────────────────────────────────────────

alter table public.posts
  add column if not exists reward_link text;

comment on column public.posts.reward_link is
  '댓글 유도 CTA에서 댓글 단 사람에게 발송할 자료 링크 (URL 또는 짧은 안내문)';

-- 기존 데이터 호환을 위해 nullable + 기존 cta_kind 값 그대로 허용
alter table public.posts
  add constraint posts_cta_kind_known
  check (cta_kind is null or cta_kind in
    ('save', 'share', 'dm', 'link', 'comment_link'));
