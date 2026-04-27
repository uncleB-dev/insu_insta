-- ─────────────────────────────────────────────────────────────
-- seed.sql
-- 글로벌 데이터 시드 (가드레일 룰, 프롬프트, 라이브러리 사진)
-- 실행 가능: idempotent (재실행해도 중복 안 생김)
-- ─────────────────────────────────────────────────────────────

-- ─── Guardrail Rules ─────────────────────────────────────────
insert into public.guardrail_rules (level, kind, pattern, message, replace_with, active) values
  ('red',    'word',  '삼성생명',                  '특정사 비방 금지',                       '특정 회사',  true),
  ('red',    'word',  '한화생명',                  '특정사 비방 금지',                       '특정 회사',  true),
  ('red',    'regex', '월\s*\d+\s*만\s*원',        '구체 보험료 명시 금지(광고 심의)',       '일정 금액',  true),
  ('red',    'regex', '\d+\s*세\s*가입',           '연령 + 가입 직접 명시 금지',             '연령대 준비', true),
  ('yellow', 'word',  '가입',                      '권유 표현 약화',                         '준비',       true),
  ('yellow', 'word',  '상담',                      '권유 표현 약화',                         '분석',       true),
  ('yellow', 'word',  '추천',                      '권유 표현 약화',                         '소개',       true),
  ('yellow', 'word',  '무조건',                    '단정 표현 약화',                         '대체로',     true),
  ('green',  'word',  '정보',                      '안전 표현',                              '',           true),
  ('green',  'word',  '점검',                      '안전 표현',                              '',           true)
on conflict do nothing;

-- ─── Prompts ─────────────────────────────────────────────────
do $$
declare
  v_prompt_id uuid;
  v_v3_id uuid;
  v_body text;
begin
  -- 메인 스크립트 생성 프롬프트
  insert into public.prompts (slug, title, description)
  values (
    'script_generation',
    '스크립트 생성',
    'AI에 9컷 카드뉴스 스크립트 생성을 요청하는 메인 프롬프트'
  )
  on conflict (slug) do update set updated_at = now()
  returning id into v_prompt_id;

  v_body := $body$당신은 한국 보험설계사 "보험삼촌 BEN"의 인스타그램 카드뉴스
스크립트를 작성하는 전문 카피라이터입니다.

# 입력
- 주제: {topic}
- 시리즈: {series}
- 페르소나: {persona}
- 핵심 팩트: {facts}
- 톤: {tone}
- 슬라이드 수: {slide_count}

# 작성 원칙 (6원칙)
1. 후킹 (hook)
2. 문제점 제시 (problem)
3. 해결책 (solution)
4. 의심제거 (doubt)
5. 희소성 (scarcity)
6. CTA

# 출력
JSON 배열로만 반환.
[{ "principle": "hook", "speaker": "uncle", "scene": "...",
   "main": "...", "sub": "...", "emphasis": ["..."] }]

# 절대 규칙
- 핵심 팩트 범위 밖의 수치/구조를 만들어내지 말 것
- 특정 보험사명을 적지 말 것
- "월 N만원" 같은 구체 보험료 금지
$body$;

  -- v1
  insert into public.prompt_versions (prompt_id, version, body, author)
  values (v_prompt_id, 'v1', v_body, 'BEN')
  on conflict (prompt_id, version) do nothing;

  -- v2
  insert into public.prompt_versions (prompt_id, version, body, author)
  values (v_prompt_id, 'v2', v_body, 'BEN')
  on conflict (prompt_id, version) do nothing;

  -- v3 (active)
  insert into public.prompt_versions (prompt_id, version, body, author)
  values (v_prompt_id, 'v3', v_body, 'BEN')
  on conflict (prompt_id, version) do nothing
  returning id into v_v3_id;

  if v_v3_id is null then
    select id into v_v3_id from public.prompt_versions
      where prompt_id = v_prompt_id and version = 'v3' limit 1;
  end if;

  update public.prompts set active_version_id = v_v3_id where id = v_prompt_id;
end $$;

-- ─── Library Photos ──────────────────────────────────────────
insert into public.library_photos (src, source, uses)
select
  'https://picsum.photos/seed/insu' || (i + 7) || '/400/400',
  case (i % 3) when 0 then 'upload'::photo_source when 1 then 'unsplash'::photo_source else 'library'::photo_source end,
  ((i * 17) % 80) / 10
from generate_series(0, 17) as i
on conflict do nothing;

-- ─────────────────────────────────────────────────────────────
-- 데모 게시물 시딩 함수 (로그인 후 사용자 본인 계정으로 호출)
-- 사용법:
--   select public.seed_demo_posts(auth.uid());   -- 본인 계정에 데모 데이터
-- ─────────────────────────────────────────────────────────────
create or replace function public.seed_demo_posts(p_owner uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post_id uuid;
begin
  if p_owner is null then
    raise exception 'owner_id required';
  end if;

  -- 게시물이 이미 있으면 시딩 스킵
  if exists (select 1 from public.posts where owner_id = p_owner) then
    raise notice 'demo posts already exist for owner %, skipping', p_owner;
    return;
  end if;

  -- p1: 9컷 풀 데이터 (가드레일 hits 포함)
  insert into public.posts (owner_id, title, series, persona, status, topic, facts, tone, cta_kind, caption)
  values (
    p_owner, '암치료비가 비싸다는데 얼마나?', 'A', '30s_office', 'published',
    '암치료비가 비싸다는데 얼마나?',
    '비급여 항암치료 평균 회당 수백만 원, 연 1억 넘는 케이스 존재',
    'normal', 'save',
    '"오빠 친구가 휴직하고 엄마 간병하는데 하루 20만원씩 나온대" — 이 카톡 한 줄이 시작이야. 진짜 그런 보험 있냐고? 있어. 비급여통합 + 진단비 두 개로 가는 게 핵심인데, 자세한 건 슬라이드에서. 저장해두고 부모님께 공유해줘.'
  )
  returning id into v_post_id;

  insert into public.slides (post_id, ord, principle, speaker, scene, main_text, sub_text, emphasis) values
    (v_post_id, 1, 'hook',     'none',  '카톡 알림 일러스트, 어두운 배경에 메시지 한 줄이 떠오른다', '하루 입원비 20만원, 진짜 그런 보험 있냐고?',          '오빠 친구가 휴직하고 엄마 간병하는데 매일 그렇게 쓴대.', array['20만원']),
    (v_post_id, 2, 'hook',     'niece', '카톡 말풍선 두 개가 화면 가운데에 떠 있음',              '삼촌!! 카톡 받았는데 이거 진짜야?',                    '엄마가 너무 걱정돼서 보냈어',                            array['진짜야']),
    (v_post_id, 3, 'problem',  'uncle', '삼촌이 진지한 얼굴로 노트북 화면을 가리킴',              '치료비 1회에 수백만 원, 연 1억 넘는 케이스도 있어',     '요즘 항암치료가 비급여 위주로 가는데 그게 다 본인 부담이거든', array['수백만 원','1억']),
    (v_post_id, 4, 'problem',  'niece', '조카가 놀란 표정의 이모티콘과 함께',                     '헐... 그게 다 자기 돈이라고?',                          '실손으로 다 되는 거 아니었어?',                          array['자기 돈']),
    (v_post_id, 5, 'solution', 'uncle', '구조도 일러스트: 비급여통합 + 진단비 박스',              '비급여통합 + 진단비, 이 두 개가 핵심이야',              '어떤 회사든 이 두 가지 구조만 갖추면 큰 그림은 같아',     array['비급여통합','진단비']),
    (v_post_id, 6, 'doubt',    'niece', '조카가 갸우뚱하는 모습',                                '근데 그거 비싸지 않아?',                                '한 달에 몇만원 더 내야 한다며',                          array['비싸지 않아']),
    (v_post_id, 7, 'doubt',    'uncle', '삼촌이 차분하게 도표를 보여줌',                          '오히려 반대야. 안 들면 한 번에 몇천만 원이 나가',       '월 단위로는 작아 보여도 평생 보면 몇 배 차이가 나',     array['몇천만 원']),
    (v_post_id, 8, 'scarcity', 'uncle', '병원 입구 일러스트, 흐릿한 배경',                        '건강할 때만 가입할 수 있다는 게 진짜 함정이야',          '진단 받고 나면 그땐 어떤 회사도 안 받아줘',              array['건강할 때만']),
    (v_post_id, 9, 'cta',      'uncle', '저장 아이콘과 공유 아이콘이 강조된 마지막 컷',           '우리 엄마 보험, 한 번 점검해볼래?',                     '저장하고 부모님께도 공유해줘',                          array['한 번 점검']);

  -- p1 해시태그
  insert into public.hashtags (post_id, category, tag) values
    (v_post_id, 'brand',   '보험삼촌'),
    (v_post_id, 'brand',   '보험삼촌BEN'),
    (v_post_id, 'brand',   'unclebstudio'),
    (v_post_id, 'topic',   '암보험'),
    (v_post_id, 'topic',   '비급여'),
    (v_post_id, 'topic',   '간병보험'),
    (v_post_id, 'topic',   '실손보험'),
    (v_post_id, 'target',  '30대보험'),
    (v_post_id, 'target',  '엄마보험'),
    (v_post_id, 'target',  '직장인보험'),
    (v_post_id, 'general', '보험상식'),
    (v_post_id, 'general', '재테크'),
    (v_post_id, 'general', '금융지식');

  -- 나머지 7개 게시물 (메타데이터만)
  insert into public.posts (owner_id, title, series, persona, status) values
    (p_owner, '1세대 실손 해지하면 진짜 후회한다는 이유',  'B', 'parent',     'draft'),
    (p_owner, '이직할 때 보험 어떻게 옮겨야 해?',         'C', 'newbie',     'published'),
    (p_owner, '신혼 부부 보험 처음부터 다시 짜기',         'C', 'newlywed',   'scheduled'),
    (p_owner, '비급여, 도대체 뭐가 비급여인지',            'A', '30s_office', 'draft'),
    (p_owner, '간병보험 vs 간병인지원금 뭐가 다른데?',     'B', 'parent',     'published'),
    (p_owner, '치아보험, 진짜 들어야 하는 사람은 누구',    'A', '30s_office', 'published'),
    (p_owner, '운전자보험 1만원짜리, 진짜 충분할까?',      'A', '30s_office', 'draft');
end $$;

grant execute on function public.seed_demo_posts(uuid) to authenticated;
