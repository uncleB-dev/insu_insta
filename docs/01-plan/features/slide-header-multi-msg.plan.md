# Plan: slide-header-multi-msg

> 게시물 머릿말(좌상단 브랜드 헤더) + 대화형 슬라이드의 여러 말풍선(main2~main4) 지원.

| Field | Value |
|---|---|
| Feature | `slide-header-multi-msg` |
| Phase | Plan |
| Created | 2026-04-28 |
| Author | BEN |
| Type | Enhancement (DB schema + UI + rendering) |
| Estimated effort | ~3~4시간 |

---

## Executive Summary

| 관점 | 요약 |
|---|---|
| **Problem** | (1) 시리즈 일관성을 위한 좌상단 브랜드 머릿말("[보험삼촌의 보험 이야기]" 또는 PNG 로고) 부재. (2) 대화형 카드(msg_left/msg_right)에서 한 슬라이드에 말풍선 1개만 가능 → "조카→삼촌→조카" 흐름이 자연스럽지 않음. |
| **Solution** | (1) `posts`에 `header_text` + `header_image_url` 추가. SlideCanvas가 좌상단에 작게 렌더 (이미지 우선, 없으면 텍스트). (2) `slides`에 `main_text2/3/4` + `speaker2/3/4` 추가. 대화형 레이아웃에서만 4개 말풍선 좌/우 교대 스택. |
| **Function/UX Effect** | 9컷 모두 동일한 브랜드 헤더로 시리즈 일관성 확보. 대화형 카드에서 자연스러운 대화 흐름 1슬라이드에 압축 가능 → 9컷 한정에 더 많은 정보 담기. |
| **Core Value** | 시각 정체성 ↑, 대화 호흡 자연화, 정보 밀도 ↑. |

---

## Context Anchor

| Anchor | Content |
|---|---|
| **WHY** | (a) 시리즈 운영자에겐 "이 콘텐츠가 누구 거인지" 한눈에 보이는 브랜드 마크가 필요 (b) 대화형 카드뉴스의 강점은 자연스러운 톤의 대화 — 1 슬라이드 = 1 말풍선이면 9컷에 담기 부족. |
| **WHO** | BEN (1인 시리즈 운영). 9컷 카드뉴스 빈도 ↑, 시리즈 일관성 ↑. |
| **RISK** | (1) 머릿말이 슬라이드 콘텐츠와 시각적으로 충돌, (2) 4개 말풍선이 들어가면 박스 밖 넘침, (3) AI 자동 생성이 main2~4를 쓸지 여부 불명확 — 우선은 사용자 수동 입력. |
| **SUCCESS** | (a) 게시물 생성/편집 시 머릿말 텍스트 또는 이미지 설정 (b) 9컷 모두 좌상단에 머릿말 자동 표시 (c) 대화형 슬라이드 편집기에 main2/3/4 + speaker2/3/4 입력 (d) 캐러셀·폰목업·ZIP 모두 자연스럽게 4개 말풍선 렌더 (e) 기존 게시물 시각 변화 0. |
| **SCOPE** | IN: posts 헤더 컬럼 2개, slides multi-message 컬럼 6개, SlideCanvas 헤더+다중 말풍선 렌더, 미리보기 페이지에서 헤더 편집, 스크립트 편집기에서 main2~4 편집 (대화형일 때만). OUT: AI가 자동으로 main2~4 채우기, 머릿말 위치 커스터마이징(좌상단 고정), 4개 초과 말풍선. |

---

## 1. Background

### 현재
- `slides.main_text` 1개만. msg_left/msg_right에서 단일 말풍선 렌더
- `posts`에 헤더 관련 필드 없음
- 시리즈 일관성은 톤·해시태그·디자인으로만 유지됨

### 인스타 카드뉴스 베스트 프랙티스
- 좌상단 브랜드 마크 (300×80px ~ 작은 텍스트) → 시리즈 식별
- 대화형 카드뉴스: 1 슬라이드에 2~4개 말풍선이 자연스러움 (호흡감)

---

## 2. Requirements

### Functional

**FR-1. 게시물 머릿말**
- DB: `posts.header_text text NULL`, `posts.header_image_url text NULL`
- 우선순위: 이미지 > 텍스트 (둘 다 있으면 이미지 사용)
- 렌더 위치: 슬라이드 좌상단 (padding 안쪽)
- 텍스트 형식: 약 12~14px, 반투명 배경 패널
- 이미지 형식: 높이 ~36px, 가로 자동, 투명 PNG 권장

**FR-2. 머릿말 편집 UI**
- `/posts/new`에 옵션 아코디언 안에 "머릿말" 입력 추가
- `/posts/[id]/preview`에 새 카드 "🏷️ 머릿말 (좌상단 브랜드)" + 텍스트 입력 + 이미지 URL 입력
  - 또는 라이브러리 픽 (이번 OUT — 다음 단계)
- 빈 값이면 표시 안 함

**FR-3. 다중 메시지 (slides.main_text2/3/4)**
- DB: 6개 컬럼 추가 — `main_text2/3/4 text NULL` + `speaker2/3/4 speaker_kind NULL`
- 대화형 레이아웃(msg_left/msg_right)에서만 표시
- main, main2, main3, main4 순서로 위 → 아래 스택
- 각 메시지의 speaker가 'niece'면 좌측 흰 말풍선, 'uncle'이면 우측 노란 말풍선, 'none'이면 좌측 흰
- main_text가 비어있는 후속 메시지는 표시 안 함

**FR-4. 스크립트 편집기 — multi-message UI**
- 대화형 레이아웃 선택된 슬라이드일 때만:
  - 메인 텍스트 + speaker (기존)
  - "+ 다음 말풍선 추가" 버튼 → 메인 2 + speaker 2 활성화
  - 최대 4개 (main, main2, main3, main4)
  - 각 메시지에 speaker 토글 (niece/uncle/none)
  - 빈 메시지는 자동 숨김

**FR-5. 비대화형 레이아웃**
- main_text2/3/4는 무시 (DB에 저장은 됨)
- 사용자가 레이아웃을 대화형 → 비대화형으로 바꿔도 데이터는 유지

### Non-Functional
- 4개 말풍선 + 헤더로 인해 박스 넘침 시 자동 압축 (말풍선 폰트 약간 ↓)
- 기존 게시물 (header NULL, main2~4 NULL) 시각 변화 0
- ZIP 다운로드 PNG에서도 동일 렌더

---

## 3. Constraints

- DB 마이그레이션 사용자 수동 (Supabase SQL Editor)
- speaker_kind enum 재사용 (`niece` / `uncle` / `none`)
- 헤더 이미지 URL은 외부 URL 또는 Supabase Storage public URL (라이브러리 활용 가능)
- AI는 이번에 main2~4 자동 채움 X (사용자 수동만)

---

## 4. Success Criteria

| ID | Criteria | Verification |
|---|---|---|
| SC-1 | posts에 header 컬럼 2개 + slides에 main_text2/3/4 + speaker2/3/4 추가 | DB 확인 |
| SC-2 | 미리보기 페이지에서 머릿말 텍스트 편집 → 디바운스 자동저장 → 9컷 모두 반영 | 수동 |
| SC-3 | 머릿말 이미지 URL 입력 시 텍스트 대신 이미지 표시 | 수동 |
| SC-4 | 스크립트 편집기에서 대화형 슬라이드 선택 → "+ 말풍선 추가" → 최대 4개 | 수동 |
| SC-5 | 각 말풍선의 speaker 변경 시 좌/우 정렬 즉시 반영 | 수동 |
| SC-6 | 빈 말풍선은 표시 안 됨 (예: main2 채우고 main3 비우면 1+2번만) | 수동 |
| SC-7 | 비대화형 레이아웃에서 main2~4 무시됨 (시각 변화 X) | 수동 |
| SC-8 | ZIP 다운로드 PNG에 헤더 + 말풍선 4개 정확히 렌더 | 수동 |
| SC-9 | 기존 게시물 시각 변화 0 | 수동 |
| SC-10 | `npm run build` 통과 | 빌드 |

---

## 5. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| 4개 말풍선 + 긴 텍스트로 박스 넘침 | 시각 깨짐 | 중 | 말풍선 maxWidth 75% + word-break + max font scaling. 매우 긴 경우 잘림 (overflow:hidden) |
| 헤더가 슬라이드 콘텐츠와 시각 충돌 | 가독성 ↓ | 중 | 좌상단 절대 위치 + 반투명 배경 + 작은 폰트. text_pos가 'top'일 때는 더 신중 |
| 기존 빈 컬럼 데이터 처리 | 회귀 | 낮음 | 모든 새 필드 nullable, fallback 처리 (기존 동작 유지) |
| 헤더 이미지 URL이 깨져있을 때 | 빈 자리 | 낮음 | onError fallback → 텍스트로 대체 |

---

## 6. Out of Scope

- AI가 자동으로 main2/3/4 채우기 (사용자 수동만)
- 헤더 위치 커스터마이징 (좌상단 고정)
- 헤더 라이브러리 (자주 쓰는 헤더 텍스트/이미지 묶음 저장)
- 4개 초과 말풍선
- 말풍선 별 폰트 크기 개별 설정
- 말풍선 별 강조 표현(emphasis)

→ 다음 단계 검토.

---

## 7. Implementation Outline

### 7.1 마이그레이션 0007

```sql
-- posts 머릿말
alter table public.posts
  add column if not exists header_text text,
  add column if not exists header_image_url text;

-- slides 다중 메시지
alter table public.slides
  add column if not exists main_text2 text,
  add column if not exists main_text3 text,
  add column if not exists main_text4 text,
  add column if not exists speaker2 speaker_kind,
  add column if not exists speaker3 speaker_kind,
  add column if not exists speaker4 speaker_kind;
```

### 7.2 SlideCanvas

- props에 `header_text?`, `header_image_url?`, `main2/3/4?`, `speaker2/3/4?` 추가
- 좌상단 absolute 영역에 헤더 렌더 (image > text)
- 대화형 레이아웃(msg_left/msg_right)일 때:
  - main + main2 + main3 + main4 (값 있는 것만) 배열로 모음
  - 각 메시지의 speaker로 좌/우 결정 (uncle → 우측 노란, 그 외 → 좌측 흰)
  - 세로 stack (gap 8px)

### 7.3 미리보기 페이지

- 새 카드 "🏷️ 머릿말 (좌상단 브랜드)" 추가
- 텍스트 input + 이미지 URL input
- 700ms 디바운스 자동저장 (`updatePostHeaderAction`)

### 7.4 스크립트 편집기

- 대화형 레이아웃일 때만 multi-message 영역 표시
- "메인 텍스트" 아래 "+ 말풍선 추가" 버튼 → main_text2 입력 + speaker pill 노출
- 최대 4단계까지

### 7.5 변경 예상 파일

**신규 1**: `0007_slide_header_multi_msg.sql`

**수정 8**:
- `studio/src/lib/supabase/types.ts` (PostRow + SlideRow 6개 + 2개 필드)
- `studio/src/components/post/SlideCanvas.tsx` (헤더 + 다중 말풍선)
- `studio/src/lib/preview.ts` (새 필드 select + map)
- `studio/src/app/(chrome)/posts/[id]/preview/actions.ts` (`updatePostHeaderAction`)
- `studio/src/components/post/PreviewBody.tsx` (머릿말 카드)
- `studio/src/lib/editor.ts` (EditorSlide에 main2~4 + speaker2~4)
- `studio/src/app/(chrome)/posts/[id]/script/actions.ts` (SlidePatch 확장)
- `studio/src/components/post/ScriptEditorClient.tsx` (multi-message UI)
- `studio/src/app/(chrome)/posts/[id]/design/page.tsx` (header join + select)

총 9~10개 파일. ~400 lines 추가, ~50 수정.

---

## 8. Acceptance Test (수동)

```
[Migration]
1. 0007 SQL 실행 → posts + slides 컬럼 추가
2. 기존 데모 게시물 진입 → 시각 변화 0

[Header]
3. 미리보기 페이지 → 머릿말 카드 발견
4. 텍스트 "보험삼촌의 보험 이야기" 입력 → 9컷 좌상단에 표시 확인
5. 이미지 URL 입력 → 텍스트 대신 이미지 표시
6. F5 → 유지

[Multi-message]
7. 스크립트 편집기 → 대화형 슬라이드 선택 (msg_left or msg_right)
8. "+ 말풍선 추가" → main2 + speaker pill 노출
9. main2에 "응 진짜야" 입력 + speaker = uncle → 디자인 페이지 미리보기에서 흰+노란 2개 말풍선
10. 최대 4개까지 추가 가능 확인
11. 비대화형 레이아웃 선택 시 multi-message 영역 사라짐 (또는 회색 처리)

[ZIP]
12. ZIP 다운로드 → PNG에 헤더 + 4개 말풍선 정확히 렌더

[Build]
13. npm run build 통과
```

---

## 9. Open Questions

| Q | 답 |
|---|---|
| 헤더가 텍스트일 때 글꼴? | Pretendard (UI 폰트) — 슬라이드 텍스트 폰트(Gmarket Sans)와 분리해 작아도 가독성 |
| 헤더 색상 | 흰색 70% 투명 + 검은 반투명 배경 패널 |
| 말풍선 4개일 때 폰트 크기 | 동일 적용 (overflow hidden) — 추후 수동 조정 |
| AI가 main2~4 채울지 | OUT (다음 단계 검토) |
| 헤더 라이브러리 | OUT (이번엔 직접 입력만) |

---

## Next: Do 단계

`/pdca do slide-header-multi-msg` → 3~4시간 분량.
