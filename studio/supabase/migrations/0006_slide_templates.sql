-- ─────────────────────────────────────────────────────────────
-- 0006_slide_templates.sql
-- slide-templates: 9개 통합 시각 템플릿 + slides.layout 마이그레이션
-- ─────────────────────────────────────────────────────────────

-- 1. templates 카탈로그 테이블
create table if not exists public.templates (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  name text not null,
  description text,
  default_for_principle principle_kind,
  active boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. updated_at 트리거
drop trigger if exists trg_templates_updated_at on public.templates;
create trigger trg_templates_updated_at
  before update on public.templates
  for each row execute function public.set_updated_at();

-- 3. RLS
alter table public.templates enable row level security;

drop policy if exists "templates_authed_read"   on public.templates;
drop policy if exists "templates_authed_update" on public.templates;
drop policy if exists "templates_authed_insert" on public.templates;
drop policy if exists "templates_authed_delete" on public.templates;

create policy "templates_authed_read"
  on public.templates for select
  to authenticated using (true);

create policy "templates_authed_update"
  on public.templates for update
  to authenticated using (true) with check (true);

create policy "templates_authed_insert"
  on public.templates for insert
  to authenticated with check (true);

create policy "templates_authed_delete"
  on public.templates for delete
  to authenticated using (true);

-- 4. 9개 기본 템플릿 시드 (idempotent: ON CONFLICT)
insert into public.templates (slug, name, description, default_for_principle, sort_order) values
  ('msg_left',    '💬 메시지 (좌)',  '카톡 흰 말풍선 좌측 — 친구가 묻는 질문 같은 느낌',         'hook',     10),
  ('msg_right',   '💬 메시지 (우)',  '카톡 노란 말풍선 우측 — 삼촌이 답하는 톤',                   'hook',     20),
  ('qa_box',      '❓ Q&A 박스',     'Q. 라벨 + 답 — 의심 해소·FAQ형',                              'doubt',    30),
  ('bold_title',  '🅱️ 볼드 타이틀',   '화면 가득 큰 텍스트 — 강한 후킹·선언',                       'hook',     40),
  ('data_card',   '📊 데이터 카드',  '큰 숫자 강조 + 설명 — 통계·금액 임팩트',                     'problem',  50),
  ('quote_card',  '❝ 인용구',         '양쪽 따옴표 + 인용문 — 희소성·명언 느낌',                    'scarcity', 60),
  ('checklist',   '✅ 체크 리스트',  '✓ 항목 3개 — 해결책·정리',                                    'solution', 70),
  ('compare_box', '⚖️ 비교 박스',     '좌(A) vs 우(B) — 대안 비교·전후',                             'problem',  80),
  ('cta_card',    '📣 CTA 마감',     '하단 액센트 영역 + 행동 유도 — 마무리',                       'cta',      90)
on conflict (slug) do nothing;

-- 5. slides.layout 마이그레이션: 기존 A~I → 새 슬러그
update public.slides set layout = case layout
  when 'A' then 'msg_left'
  when 'B' then 'msg_right'
  when 'C' then 'qa_box'
  when 'D' then 'bold_title'
  when 'E' then 'bold_title'
  when 'F' then 'quote_card'
  when 'G' then 'bold_title'
  when 'H' then 'checklist'
  when 'I' then 'cta_card'
  else layout -- 이미 새 슬러그면 그대로
end
where layout in ('A','B','C','D','E','F','G','H','I');
