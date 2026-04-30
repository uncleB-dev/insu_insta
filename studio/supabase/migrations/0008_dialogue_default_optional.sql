-- ─────────────────────────────────────────────────────────────
-- 0008_dialogue_default_optional.sql
-- (선택 실행) 기존 모든 슬라이드를 대화형 레이아웃으로 변환
--
-- 새 게시물(AI 생성)은 코드 변경으로 자동으로 대화형이 됩니다.
-- 이 SQL은 **이미 만들어둔 게시물들도 대화형으로 통일**하고 싶을 때만 실행.
-- 실행하지 않아도 새 게시물부터는 자동 대화형.
-- ─────────────────────────────────────────────────────────────

-- 모든 슬라이드의 layout을 speaker 기반으로 대화형으로 변경
update public.slides
set layout = case
  when speaker = 'uncle' then 'msg_right'
  else 'msg_left'
end;

-- 확인용 select (자동 실행되지는 않음, 참고만)
-- select layout, count(*) from public.slides group by layout order by count(*) desc;
