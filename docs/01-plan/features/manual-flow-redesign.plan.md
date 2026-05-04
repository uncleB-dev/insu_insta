# Plan: manual-flow-redesign

> "AI 한 번에 다 만들기" → "사용자가 직접 작성, AI는 도구로만" 흐름 재설계.
> 주제+카드수 → 카드별·화자별 수동 입력 → 가드레일 검토 → 자동 톡 디자인 → 미리보기.

| Field | Value |
|---|---|
| Feature | `manual-flow-redesign` |
| Phase | Plan |
| Created | 2026-05-04 |
| Author | BEN |
| Type | Major refactor (UX flow + AI scope + DB minor) |
| Estimated effort | ~6~8시간 |

---

## Executive Summary

| 관점 | 요약 |
|---|---|
| **Problem** | 현재 `/posts/new`에서 AI가 9컷+디자인+캡션을 한 번에 생성 → 사용자는 AI 결과물 위에 수정만 가능. "내가 만든다" 감각 부재 + 한글 IME 동시 부담 + 의도와 다른 구조 + AI 비용. |
| **Solution** | 흐름 재구성. (1) 주제+카드수만 입력 → 빈 슬라이드 N개 생성 (2) 한 화면에서 카드별·화자별·말풍선별 직접 작성 (3) 같은 페이지 하단에서 가드레일 자동 검토 (4) 디자인 페이지에서 화자에 따라 자동 톡 배치 + 사용자 이미지 추가 (5) 미리보기에서 캡션·해시태그 AI 보조 + 저장. |
| **Function/UX Effect** | "내가 카드뉴스를 짓고 → AI가 마무리 도와줌" 흐름. 한글 입력 부담은 한 곳(스크립트 입력)에 집중되고 거기엔 IME-safe DebouncedTextarea 적용. AI는 보조 도구(캡션·해시태그·배경 이미지)로만. |
| **Core Value** | 작가의 컨트롤 ↑ + 비용 ↓ (스크립트 AI 호출 제거) + 한글 입력 안정 + 의도 일치율 ↑. |

---

## Context Anchor

| Anchor | Content |
|---|---|
| **WHY** | 작가(BEN)가 카드뉴스를 직접 짓는 도구가 필요. AI는 "초안 생성기"가 아니라 "보조 도구"여야 함. 현재 흐름은 AI 생성 → 수정 → 저장이라 사용자 의도와 매번 어긋남. |
| **WHO** | BEN (1인 운영). "친구 카톡" 톤 시리즈 작성 중심. |
| **RISK** | (1) 기존 게시물(AI 생성된)의 호환성, (2) 한 화면에 9컷 입력 폼 → 페이지 길어짐 + 한글 입력 부담 분산 필요, (3) AI 스크립트 생성 코드 제거 시 사이드이펙트, (4) "디자인 자동 톡 배치"의 의미 명확화 필요. |
| **SUCCESS** | (a) 새 게시물 생성 시 주제+카드수만 입력 → 빈 N장 슬라이드 생성 → 스크립트 페이지 자동 진입 (b) 한 화면에서 9컷 모두 한 번에 입력 가능 (c) 가드레일 위반 인라인 표시 + 자동 교체 가능 (d) 디자인 단계가 화자 기반 자동 좌/우 배치 + 사용자 이미지 추가 (e) 캡션·해시태그·배경 이미지 AI 도구는 그대로 (f) 기존 게시물도 정상 동작 (회귀 X). |
| **SCOPE** | IN: `/posts/new` 폼 단순화, `/posts/[id]/script` 한 화면 N카드 폼으로 재설계, slides에 `inset_images jsonb` 추가, AI 스크립트 생성 server action 제거. OUT: AI 캡션·해시태그·이미지 생성 (그대로 유지), 머릿말 / 다중 말풍선 / 9 템플릿 (그대로). |

---

## 1. Background

### 현재 흐름 (`generatePostAction`)
```
사용자 입력: 주제, 시리즈, 페르소나, 핵심팩트, 톤, 슬라이드수, CTA, [reward_link]
  ↓
AI(Gemini) 호출:
  - 9컷 스크립트 (principle, speaker, scene, main, sub, emphasis)
  - 모든 슬라이드 layout 자동 결정 (speaker 기반 대화형)
  ↓
DB insert: posts + slides[N]
  ↓
/posts/[id]/script 으로 자동 이동
```

문제:
- 한 번 AI 호출로 9컷+레이아웃까지 결정 → "AI가 만든 결과를 내가 수정"하는 입장
- 사용자가 손수 카드 흐름을 디자인하기 어려움
- 비용: Gemini text 호출 1회 (~$0.001~0.005)
- 한글 IME 부담이 스크립트 편집 단계에 집중되는데 입력량이 많음 → 입력 깨짐

### AI 도구로서 유지되는 것
- ✨ AI 캡션 + 해시태그 (grounded search) — 미리보기 페이지
- 🎨 Nano Banana 이미지 생성 — 라이브러리 + 디자인 페이지
- 🛠️ 가드레일 자동 검사 (룰 매칭, AI 아님)

---

## 2. Requirements

### Functional

#### FR-1. `/posts/new` 폼 단순화
- 입력 필드 (필수만 남김):
  - **주제 한 줄** (예: "5세대 실손 전환해야 할까?")
  - **카드 수** (5 / 7 / 9 / 11 / 13 — select)
  - **시리즈** (A/B/C — 분류용)
  - **CTA 모드** (저장/공유/DM/링크/💬댓글유도)
  - **reward_link** (CTA = comment_link일 때만)
- **제거할 필드**: 페르소나, 핵심 팩트, 톤, 키워드, "안 파는 설계사" 강조, 참고자료
  - (이 정보들은 사용자가 스크립트 작성 시 자체 반영)
- **버튼**: "스크립트 작성 →" (AI 호출 X, 빈 N장 슬라이드 즉시 생성 후 script 페이지로 이동)

#### FR-2. `/posts/[id]/script` 한 화면 N카드 폼으로 재설계
- 페이지 진입 시 모든 카드(1~N)가 세로로 나열
- 각 카드는 다음 필드:
  - **카드 N · [6원칙 select]** (사용자가 hook/problem/solution/doubt/scarcity/cta 직접 선택)
  - **화자 + 메시지** (1~4개)
    - 화자 토글: 조카(좌) / 삼촌(우) / 없음(좌)
    - 메시지 텍스트 (DebouncedTextarea, IME-safe)
    - "+ 메시지 추가" 버튼 (최대 4개)
    - "✕" 메시지 삭제
  - **장면 묘사** (선택) — 디자인 단계 참고용
  - **보조 텍스트** (선택)
  - **강조 표현** (볼드 처리할 단어)
- 우측 사이드 또는 하단 sticky:
  - **🔍 전체 가드레일 검토** (그린/옐로/레드 카운트)
  - **각 카드의 인라인 위반어 하이라이트** + 자동 교체 클릭
  - **모든 카드 통과 시 "디자인으로 →" 버튼 활성화**
- 카드 추가/삭제/순서 변경 가능

#### FR-3. 가드레일 검토 (인라인)
- 입력한 모든 메시지(main + main2/3/4) 텍스트를 active 가드레일 룰로 매칭
- 위반 단어 인라인 빨간/노란 밑줄 + hover시 추천 대체어 + 클릭 시 자동 교체
- 페이지 상단에 통합 카운트: "그린 N / 옐로 M / 레드 K"
- 레드가 1개 이상이면 "디자인으로 →" 클릭 시 확인 다이얼로그

#### FR-4. `/posts/[id]/design` — 자동 톡 배치 + 이미지
- 좌측: 카드 썸네일 N개 (자동 톡 배치 미리보기)
- 중앙: 1080×1080 미리보기 (현재 SlideCanvas 그대로)
- 우측 옵션:
  - **레이아웃 템플릿** 9개 — 화자에 따른 자동 톡 추천 (★ 표시)
  - **배경 사진** (업로드/AI/라이브러리 — 현재 그대로)
  - **🆕 보조 이미지** (카드 안에 작은 이미지/일러스트/아이콘 삽입)
    - 위치: 좌상단/우상단/좌하단/우하단/중앙 (5 위치 선택)
    - 크기: small/medium/large
    - URL: 라이브러리 픽 또는 직접 업로드
    - 최대 1개/슬라이드 (이번 단계)
  - 흐림/오버레이/텍스트 위치/강조 컬러/폰트 (현재 그대로)

#### FR-5. `/posts/[id]/preview` — 그대로 유지
- 캡션 + ✨ AI 자동 생성 (grounded search)
- 해시태그 편집
- 머릿말 (브랜드 헤더)
- 게시 상태 + 예약 날짜
- ZIP 다운로드

### Non-Functional
- 한 화면 N카드 입력 시 페이지 스크롤 길어짐 → 좌측 카드 인덱스 + sticky로 빠른 이동
- 모든 textarea는 DebouncedTextarea (IME-safe)
- 기존 게시물(AI 생성된 것) 진입 시 시각적·기능적 회귀 0

---

## 3. Constraints

- **DB 마이그레이션 0009 필요**: `slides`에 `inset_image_url`, `inset_image_pos`, `inset_image_size` 추가 (간단)
- **AI 스크립트 생성 코드 제거**: `posts/new/actions.ts`의 `generatePostAction`은 빈 슬라이드만 생성하도록 변경, Gemini 호출 제거
- **`generateScript`** 함수는 `lib/ai/gemini.ts`에 남기되 사용처 제거 (추후 "AI 도움" 옵션 부활 가능)
- 기존 게시물의 슬라이드(이미 layout/principle 채워짐)는 그대로 활용 — 재진입 시 스크립트 페이지에서 정상 표시
- 가드레일 룰 시스템 그대로 — 인라인 표시는 기존 GuardedText 활용

---

## 4. Success Criteria

| ID | Criteria | Verification |
|---|---|---|
| SC-1 | `/posts/new` 폼이 주제+카드수+시리즈+CTA만 표시 | 시각 |
| SC-2 | "스크립트 작성 →" 클릭 시 빈 슬라이드 N장 즉시 생성 (Gemini 호출 X) | 네트워크 + DB |
| SC-3 | `/posts/[id]/script`에 N개 카드 세로 나열 | 시각 |
| SC-4 | 각 카드에 6원칙 select + 화자별 메시지 1~4개 입력 가능 | 수동 |
| SC-5 | 메시지 입력 시 한글 IME 정상 작동 (커서 안 튐, 글자 안 빠짐) | 수동 |
| SC-6 | 가드레일 위반어 자동 인라인 표시 + 클릭 자동 교체 | 수동 |
| SC-7 | 페이지 상단에 가드레일 카운트 (그린/옐로/레드) | 시각 |
| SC-8 | 레드 1개 이상이면 "디자인으로" 클릭 시 확인 다이얼로그 | 수동 |
| SC-9 | 디자인 페이지에서 화자에 따라 좌(흰)/우(노란) 자동 배치 | 시각 |
| SC-10 | 디자인 페이지에서 보조 이미지 추가 + 위치/크기 설정 | 수동 |
| SC-11 | ZIP 다운로드 PNG에 보조 이미지 정확히 렌더 | 시각 |
| SC-12 | 기존 게시물 시각·기능 회귀 0 | 수동 |
| SC-13 | `npm run build` 통과 | 빌드 |

---

## 5. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| 한 화면 N카드 입력 폼 길이 → 길게 스크롤 | UX 부담 | 중 | 좌측 카드 인덱스 + sticky 가드레일 카운트로 빠른 이동 |
| 한글 IME 깨짐 (이전 이슈 재발) | 입력 불가 | 중 | 모든 textarea DebouncedTextarea 적용 (이미 검증됨) + 한 화면이라 컴포넌트 수 ↑ → 신중한 메모이제이션 |
| AI 스크립트 생성 제거 시 기존 콜사이트 누락 | 빌드 에러 | 낮음 | 빌드 + 검색으로 확인. generateScript 함수는 lib에 남기되 호출 제거 |
| 사용자가 9개 카드 모두 빈 채로 디자인으로 가려 함 | 빈 미리보기 | 낮음 | "최소 1개 카드는 메시지 있어야" 검증, 또는 빈 카드는 디자인에서 빈 박스로 표시 |
| 보조 이미지 + 메시지 + 헤더 겹침 | 시각 깨짐 | 중 | 5 위치 미리 정의 (좌상/우상/좌하/우하/중앙) + 메시지 영역과 겹치지 않게 z-index 신중 |
| 기존 게시물 재진입 시 페이지 변경된 폼에 못 맞음 | 회귀 | 중 | 마이그레이션은 컬럼 추가만(nullable). 기존 슬라이드는 multi-msg 비어있어도 문제 없음 |

---

## 6. Out of Scope

- AI 스크립트 작성 도우미 (각 카드별 ✨ 추천) — 추후 검토
- 카드 단위 드래그 정렬 — 이번엔 ▲▼ 버튼만
- 보조 이미지 다중 (1슬라이드에 여러 개)
- 보조 이미지 자유 위치 (5 프리셋만)
- 모바일 반응형 (현재 데스크톱)

---

## 7. Implementation Outline

### 7.1 마이그레이션 0009 (보조 이미지)

```sql
alter table public.slides
  add column if not exists inset_image_url text,
  add column if not exists inset_image_pos text default 'top_right' check (
    inset_image_pos is null or
    inset_image_pos in ('top_left','top_right','bottom_left','bottom_right','center')
  ),
  add column if not exists inset_image_size text default 'small' check (
    inset_image_size is null or
    inset_image_size in ('small','medium','large')
  );
```

### 7.2 `/posts/new` 단순화

`studio/src/app/(chrome)/posts/new/page.tsx`:
- 폼 필드 제거: persona, facts, tone, keywords, emphasizeNoSell, refs
- 폼 필드 유지: topic, series, slideCount, cta, rewardLink (조건부)
- 버튼 텍스트: "스크립트 생성 →" → "스크립트 작성 →"
- 로딩 모달 제거 (즉시 생성이라 필요 없음)

`studio/src/app/(chrome)/posts/new/actions.ts`:
- `generatePostAction` → `createBlankPostAction`으로 의미 변경
- Gemini 호출 부분 제거
- 빈 슬라이드 N개 insert (principle: 'hook' 등 기본값, 모두 빈 main_text)
  - 단, 카드 1번은 'hook' / niece (첫 후킹 = 조카 질문 패턴 유지)
  - 나머지는 'hook' / 'uncle' 등 골고루 (사용자가 직접 변경)

### 7.3 `/posts/[id]/script` 재설계

`studio/src/components/post/ScriptEditorClient.tsx`:
- 좌측 패널 슬라이드 카드 리스트 → **인덱스 네비게이션**으로 변경 (카드 N으로 점프)
- 우측 패널 단일 카드 편집 → **모든 카드 세로 나열 폼**으로 변경
- 각 카드 컴포넌트: `<ScriptCard slide={slide} ... />`
  - 6원칙 select
  - 메시지 1~4 (multi-message editor 통합)
  - 장면 묘사 (DebouncedTextarea)
  - 보조 텍스트 (DebouncedTextarea)
  - 강조 태그
  - 카드 가드레일 미니 점수
- 페이지 상단 sticky:
  - 통합 가드레일 카운트
  - "디자인으로 →" 버튼 (레드 0 또는 무시 확인)
- 카드 ▲▼ 순서 변경 + ＋ 추가 + 🗑️ 삭제

### 7.4 `/posts/[id]/design` — 보조 이미지 추가

`studio/src/components/post/SlideCanvas.tsx`:
- props에 `inset_image_url`, `inset_image_pos`, `inset_image_size` 추가
- 위치별 absolute 박스 렌더 (5 프리셋)
- 크기별 width/height (small=72px, medium=120px, large=168px)
- z-index: 배경 < 메시지 < 보조 이미지 (앞쪽)
- 머릿말과 보조 이미지 위치 겹치면 (좌상단), 보조 이미지가 우상단으로 자동 fallback

`studio/src/components/post/DesignEditorClient.tsx`:
- 우측 옵션 패널 새 영역: "🖼️ 보조 이미지"
  - 현재 사진 미리보기 + ✕
  - 라이브러리에서 픽 / AI 생성 / URL 입력
  - 위치 5택 + 크기 3택
- DesignSlide 타입 + DB 매핑 확장

### 7.5 변경 예상 파일

**신규 1**: `0009_inset_images.sql`

**대규모 수정 5**:
- `studio/src/app/(chrome)/posts/new/page.tsx` (폼 단순화)
- `studio/src/app/(chrome)/posts/new/actions.ts` (AI 제거 + 빈 슬라이드)
- `studio/src/components/post/ScriptEditorClient.tsx` (한 화면 N카드 폼)
- `studio/src/components/post/SlideCanvas.tsx` (보조 이미지 렌더)
- `studio/src/components/post/DesignEditorClient.tsx` (보조 이미지 UI)

**중간 수정 4**:
- `studio/src/lib/supabase/types.ts` (SlideRow에 inset 필드)
- `studio/src/lib/preview.ts` (select + map)
- `studio/src/app/(chrome)/posts/[id]/script/page.tsx` (slides select)
- `studio/src/app/(chrome)/posts/[id]/script/actions.ts` (SlidePatch 확장)

총 9~10개 파일. ~700 lines 추가, ~400 수정/삭제.

---

## 8. Acceptance Test

```
[Migration]
1. 0009 SQL 실행 → slides에 inset_image_* 컬럼 추가

[posts/new 단순화]
2. 대시보드 → "새 게시물 만들기" 또는 사이드바 → posts/new
3. 폼 필드: 주제 / 카드수 / 시리즈 / CTA / (CTA=comment_link면 reward_link)
4. "스크립트 작성 →" 클릭 → 1~2초 내 script 페이지로 이동 (Gemini 호출 X)

[script 한 화면 N카드]
5. N개 빈 카드가 세로로 나열된 폼 보임
6. 카드 1: 6원칙 = hook (기본), 화자 = niece, 메시지 입력 — 한글 부드럽게
7. "+ 메시지 추가" → 화자 토글 + 텍스트박스 추가 (최대 4)
8. 카드 2~9: 6원칙 변경, 메시지 작성
9. 가드레일 위반 단어 사용 → 인라인 빨간/노란 밑줄 + 클릭 자동 교체
10. 상단 카운트: 그린 N / 옐로 M / 레드 K 실시간 갱신
11. 레드 0 상태에서 "디자인으로 →" 클릭 → /design 진입

[design + 보조 이미지]
12. 디자인 페이지에서 카드 1 선택
13. 화자 niece 기반으로 좌측 흰 말풍선 자동 배치 확인
14. 우측 "🖼️ 보조 이미지" 영역에서 라이브러리 픽 → 위치 우상단 → 크기 small
15. 미리보기에 작은 보조 이미지 우상단에 표시 확인
16. ZIP 다운로드 → PNG에 보조 이미지 정확히 렌더

[Build + 회귀]
17. 기존 게시물(AI 생성된) 진입 → 시각·기능 동일 (회귀 0)
18. npm run build 통과
```

---

## 9. Open Questions

| Q | 답 |
|---|---|
| AI 스크립트 생성 함수 (`generateScript`) 완전 제거? | **남김** — 코드 보관, 호출만 제거. 추후 "AI 도움" 옵션 부활 가능 |
| 카드별 6원칙 기본값 | 1=hook, 2~3=problem, 4~5=solution, 6=doubt, 7=scarcity, 8~9=cta (사용자 자유 변경) |
| 카드 수 옵션 | 5 / 7 / 9 / 11 / 13 |
| 가드레일 검토 페이지 분리 | OUT — 스크립트 페이지에 인라인 |
| 카드 드래그 정렬 | OUT — ▲▼ 버튼만 |
| 보조 이미지 다중 | OUT — 1슬라이드 1개 |

---

## Next: Do 단계

`/pdca do manual-flow-redesign` → 6~8시간 분량.

모듈 분할 권장:
- `module-1`: 마이그레이션 0009 + posts/new 단순화 + 빈 슬라이드 생성
- `module-2`: 스크립트 페이지 한 화면 N카드 폼 재설계 (가장 큰 작업)
- `module-3`: 가드레일 인라인 통합 + 페이지 상단 카운트
- `module-4`: SlideCanvas 보조 이미지 렌더링
- `module-5`: 디자인 페이지 보조 이미지 UI

`/pdca do manual-flow-redesign --scope module-1` 식으로 단계별 가능.
