# Plan: slide-templates

> 슬라이드 시각 템플릿(레이아웃)을 정비하고 라이브러리에서 관리 가능하게 한다.
> 현재 디자인 페이지의 A~I 9개와 라이브러리 템플릿 탭의 6개로 분리된 두 시스템을 하나로 통합하고,
> 9개의 진짜 시각적으로 구분되는 템플릿으로 정제 + AI가 6원칙별 기본 템플릿 자동 추천.

| Field | Value |
|---|---|
| Feature | `slide-templates` |
| Phase | Plan |
| Created | 2026-04-28 |
| Author | BEN |
| Type | Refactor + UX (DB schema + rendering + UI) |
| Estimated effort | ~5~7시간 |

---

## Executive Summary

| 관점 | 요약 |
|---|---|
| **Problem** | 디자인 페이지의 레이아웃 A~I (9개)는 A/B/C만 시각적으로 구분되고 D~I는 똑같이 가운데 큰 텍스트로 렌더링됨. 라이브러리 템플릿 탭의 6개는 toast만 동작하고 디자인 페이지와 분리되어 있음. 두 시스템이 동기화되지 않아 BEN이 어떤 게 진짜 작동하는지 헷갈림. |
| **Solution** | 9개의 의도적 시각 템플릿(메시지 좌/우 / Q&A / 볼드 타이틀 / 데이터 카드 / 인용구 / 체크 리스트 / 비교 박스 / CTA 마감)으로 통합. 라이브러리 템플릿 탭에서 미리보기·활성/비활성 가능. AI 스크립트 생성 시 6원칙별 기본 템플릿 자동 적용. 사용자는 디자인 페이지에서 언제든 변경. |
| **Function/UX Effect** | "이 슬라이드는 무슨 모양일까?" 한눈에 보임. 6원칙별로 어울리는 모양이 자동 적용되어 처음부터 매력적. 나중에 손볼 때 라이브러리에서 템플릿을 켜고 끄면 디자인 페이지 선택지에도 즉시 반영. |
| **Core Value** | 시각적 정체성 일관성 ↑, 작업 시간 ↓ (자동 추천), 시스템 단일화로 인지 부담 ↓. |

---

## Context Anchor

| Anchor | Content |
|---|---|
| **WHY** | 현재 9개 레이아웃 중 A/B/C만 의미있게 다르고 D~I는 화면상 동일. 라이브러리 템플릿 탭은 mock. BEN은 "데이터 카드 어떻게 만들지?"라는 의도가 있어도 시스템이 받아주지 못함. |
| **WHO** | BEN — 9컷 카드뉴스의 시각적 다양성을 직접 컨트롤하고 싶은 1인 운영자. |
| **RISK** | (1) 기존 A~I 슬라이드 데이터 호환 (마이그레이션 필요), (2) 새 템플릿 9개가 모든 텍스트 길이에서 잘 보이는지 검증 필요, (3) AI 자동 추천이 어색한 경우. |
| **SUCCESS** | (a) 디자인 페이지 레이아웃 9개가 각각 시각적으로 명확히 구분 (b) 라이브러리 템플릿 탭에서 활성/비활성 토글이 실제 디자인 페이지에 반영 (c) 새 게시물 AI 생성 시 6원칙별 기본 템플릿 자동 적용 (d) 기존 A~I 데이터 무손실 마이그레이션. |
| **SCOPE** | IN: 9개 새 템플릿 시각 구현(SlideCanvas), DB 스키마 변경(templates 테이블 + slides.layout 마이그레이션), 라이브러리 관리 UI, AI 6원칙→템플릿 자동 적용, 디자인 페이지 9개 → 활성 N개로 필터. OUT: 사용자 정의 템플릿(고급), 템플릿별 폰트 사이즈 차등화(이미 design-font-size 있음), 외부 템플릿 import. |

---

## 1. Background

### 현 상태 점검

**디자인 페이지의 레이아웃 A~I** (`SlideCanvas.tsx`)

| ID | 이름 | 실제 시각 | 평가 |
|---|---|---|---|
| A | 카톡 좌측 | ✅ 흰 말풍선 좌측 정렬 | OK |
| B | 카톡 우측 | ✅ 노란 말풍선 우측 정렬 | OK |
| C | Q&A 박스 | ✅ Q. 라벨 + 박스 | OK |
| D~I | 구조도/풀블리드/인용/타이틀/리스트/CTA | ❌ 모두 가운데 큰 텍스트 (동일) | 시각 차별화 X |

**라이브러리 템플릿 탭** (`/library`)

| 이름 | 동작 |
|---|---|
| 볼드 / 좌우분할 / 미니멀 / 데이터 / 인용구 / 리스트 | toast만 |

→ 두 시스템이 **분리·미완성**. BEN의 멘탈 모델("9컷 중 이건 데이터 카드, 저건 인용구")을 받아주지 못함.

---

## 2. Requirements

### Functional

**FR-1. 9개 통합 템플릿 정의**

| Slug | 이름 | 시각 특징 | 어울리는 6원칙 (default) |
|---|---|---|---|
| `msg_left` | 💬 메시지 (좌) | 흰 카톡 말풍선 좌측 | hook (none/niece) |
| `msg_right` | 💬 메시지 (우) | 노란 카톡 말풍선 우측 | hook (uncle) |
| `qa_box` | ❓ Q&A 박스 | Q. 라벨 + 답 | doubt |
| `bold_title` | 🅱️ 볼드 타이틀 | 화면 가득 큰 텍스트 | hook |
| `data_card` | 📊 데이터 카드 | 큰 숫자 + 설명 | problem |
| `quote_card` | ❝ 인용구 | 따옴표 + 인용문 | scarcity |
| `checklist` | ✅ 체크 리스트 | 3개 아이콘 + 항목 | solution |
| `compare_box` | ⚖️ 비교 박스 | 좌(A) vs 우(B) | problem (대안 비교) |
| `cta_card` | 📣 CTA 마감 | 하단 강조 영역 + 액션 | cta |

**FR-2. SlideCanvas 시각 구현**
각 슬러그마다 별도 분기로 렌더. 폰트 크기·줄간격(design-font-size)·블러·오버레이는 그대로 작동.

**FR-3. DB 마이그레이션 0006**
- `templates` 테이블 신규: `id`, `slug`(unique), `name`, `description`, `default_for_principle`(nullable), `active`(bool default true), `sort_order` (smallint), `created_at`, `updated_at`
- 9개 시드 데이터 삽입
- `slides.layout` 기존 값 매핑:
  - A → `msg_left`
  - B → `msg_right`
  - C → `qa_box`
  - D, E, G → `bold_title`
  - F → `quote_card`
  - H → `checklist`
  - I → `cta_card`
- check constraint: `slides.layout in (templates.slug)` (또는 FK)

**FR-4. 라이브러리 템플릿 탭 — 진짜 동작**
- DB의 9개 템플릿 카드 그리드 표시
- 각 카드: 1080×1080 미니 미리보기 (예시 텍스트 적용) + 이름 + 설명 + "기본 적용 6원칙" 뱃지 + 활성/비활성 스위치
- 활성/비활성은 즉시 DB 업데이트 (Server Action)
- 비활성 템플릿은 디자인 페이지 레이아웃 선택지에서 제외

**FR-5. 디자인 페이지 레이아웃 그리드**
- 라이브러리에서 가져온 active 템플릿만 노출
- ★ "이 슬라이드 6원칙에 어울리는" 표시 (`default_for_principle === slide.principle`)
- 비활성 → 숨김

**FR-6. AI 스크립트 생성 시 6원칙별 자동 추천**
- `posts/new/actions.ts`의 `generatePostAction`에서 슬라이드 insert 시:
  - 각 슬라이드의 `principle`에 매칭되는 첫 active 템플릿 → `slides.layout`
  - 동일 principle 슬라이드가 여러 개면 약간 변형 (msg_left ↔ msg_right 교차 등)
- 사용자는 디자인 페이지에서 언제든 변경

**FR-7. 미리보기 페이지·ZIP 다운로드 호환**
- SlideCanvas만 수정하면 자동으로 모든 곳 반영 (이미 단일 출처)

### Non-Functional
- 각 템플릿 한국어 짧은 텍스트 ~ 긴 텍스트 모두 자연스럽게 보여야 함 (overflow 처리)
- 라이브러리 미리보기는 lazy render (스크롤 시)
- 마이그레이션 시 기존 게시물 시각 변화 최소

---

## 3. Constraints

- 기존 슬라이드 (지금 데모 게시물 + AI로 만든 모든 게시물)는 layout 컬럼 값이 'A'~'I'
- 마이그레이션은 무손실 (UPDATE WHERE)
- DB가 RLS 적용 중이라 templates 테이블에도 RLS 정책 필요 (read all authenticated, write authenticated)
- 사용자 정의 템플릿은 이번 OUT (nice-to-have)

---

## 4. Success Criteria

| ID | Criteria | Verification |
|---|---|---|
| SC-1 | 9개 템플릿 모두 시각적으로 명확히 구분 (한눈에 다른 모양) | 시각 |
| SC-2 | 라이브러리 템플릿 탭 → 9개 카드 미리보기 표시 | 시각 |
| SC-3 | 활성 토글 OFF → 디자인 페이지 그리드에서 사라짐 | 수동 |
| SC-4 | AI 스크립트 생성 → 각 슬라이드 layout이 principle 기본 템플릿으로 채워짐 | DB 확인 |
| SC-5 | 디자인 페이지 ★ 표시가 templates.default_for_principle 기준으로 정확 | 시각 |
| SC-6 | 기존 게시물 (A~I 데이터) 마이그레이션 후 시각적 변화 최소화 | 수동 |
| SC-7 | 미리보기 페이지 + ZIP 다운로드에서 새 템플릿 정확히 렌더 | 수동 |
| SC-8 | `npm run build` 통과 | 빌드 |

---

## 5. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| 마이그레이션 시 기존 D~I 슬라이드의 시각 변화 (D~I → bold_title) | 기존 게시물 UI 변경 | 중 | 기존 D~I는 어차피 동일했으므로 큰 변화 X. 사용자에게 "디자인 점검" 권장 안내 |
| data_card / compare_box 같은 새 템플릿이 일반 텍스트에 부적합 | 시각 깨짐 | 중 | 템플릿별 fallback (텍스트가 너무 길면 bold_title처럼 폴백) + word-break 적용 |
| AI가 6원칙 추천 템플릿을 무시하고 다른 걸 만드는 경우 | 일관성 ↓ | 낮음 | AI는 main_text만 만들고, layout 매핑은 server action에서 결정 (AI에 안 맡김) |
| templates 테이블 마이그레이션 시 RLS 빠뜨림 | 401 에러 | 낮음 | 마이그레이션 SQL에 RLS 정책 포함 |
| 기존 디자인 페이지에서 본 layout 옵션이 갑자기 사라짐 (UX 혼란) | 혼란 | 중 | 마이그레이션 후 첫 진입 시 안내 토스트 ("템플릿 시스템이 9개로 정리되었어요") |

---

## 6. Out of Scope

- 사용자 정의 템플릿 추가 (BEN이 직접 새 템플릿 디자인)
- 템플릿별 차등 디자인 (color theme override 등)
- 템플릿별 데이터 필드 강제 (예: data_card는 "숫자 + 설명" 입력 강제)
- 템플릿 import/export
- 인스타그램 카드뉴스 외 포맷 지원

---

## 7. Implementation Outline

### 7.1 DB 마이그레이션 (0006)

```sql
-- templates 테이블
create table public.templates (
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

-- 9개 시드 (slug, name, description, default_for_principle, sort_order)

-- 기존 slides.layout 마이그레이션
update slides set layout = case layout
  when 'A' then 'msg_left'
  when 'B' then 'msg_right'
  when 'C' then 'qa_box'
  when 'D' then 'bold_title'
  when 'E' then 'bold_title'
  when 'F' then 'quote_card'
  when 'G' then 'bold_title'
  when 'H' then 'checklist'
  when 'I' then 'cta_card'
  else 'msg_left'
end;

-- RLS
alter table public.templates enable row level security;
create policy "templates_authed_read" on public.templates for select to authenticated using (true);
create policy "templates_authed_update" on public.templates for update to authenticated using (true) with check (true);
```

### 7.2 SlideCanvas 시각 구현

`studio/src/components/post/SlideCanvas.tsx`:
- `slide.layout` 분기 9개로 확장
- 각 분기마다 명확히 다른 시각:
  - `msg_left`: (현재 A 그대로)
  - `msg_right`: (현재 B 그대로)
  - `qa_box`: (현재 C 그대로)
  - `bold_title`: 큰 텍스트 + 그림자
  - `data_card`: 숫자 추출(emphasis 첫 번째) + 큰 폰트 + 설명 작게
  - `quote_card`: 양쪽 따옴표 + 중앙 인용문
  - `checklist`: emphasis를 ✅ 항목으로 (없으면 메인 텍스트 줄바꿈 split)
  - `compare_box`: emphasis 2개 → 좌우 박스, 없으면 메인 텍스트 split
  - `cta_card`: 하단 50% 액센트 색 배경 + 메인 텍스트 + sub_text 위로

### 7.3 라이브러리 템플릿 탭

`studio/src/components/library/LibraryClient.tsx`:
- DB에서 templates fetch → 카드 그리드
- 각 카드에 SlideCanvas 미니 미리보기 (예시 텍스트, size=200)
- 활성/비활성 스위치 → server action `toggleTemplateAction(id, active)`

`studio/src/app/(chrome)/library/actions.ts`에 추가:
- `toggleTemplateAction(id, active)`

### 7.4 디자인 페이지 active 템플릿만 노출

`studio/src/app/(chrome)/posts/[id]/design/page.tsx`:
- templates fetch 추가, 활성만 client에 전달
- `DesignEditorClient`의 LAYOUTS 하드코딩 제거 → props로 받음

### 7.5 AI 자동 추천

`studio/src/app/(chrome)/posts/new/actions.ts`:
- 슬라이드 insert 직전 templates fetch (active + default_for_principle)
- 각 슬라이드의 principle에 맞는 슬러그를 layout으로 채움
- 동일 principle 연속 시 변형 (예: hook 2개 → msg_left, msg_right 교차)

### 7.6 변경 예상 파일

**신규 1**: `0006_slide_templates.sql`
**수정 6**:
- `studio/src/lib/supabase/types.ts` (Templates 타입 추가)
- `studio/src/components/post/SlideCanvas.tsx` (9개 분기)
- `studio/src/components/library/LibraryClient.tsx` (템플릿 탭 진짜 동작)
- `studio/src/app/(chrome)/library/actions.ts` (toggleTemplateAction)
- `studio/src/app/(chrome)/posts/[id]/design/page.tsx` + `DesignEditorClient.tsx` (props로 active 받기)
- `studio/src/app/(chrome)/posts/new/actions.ts` (자동 추천)

**예상**: +500 / 수정 100 / -50 lines

---

## 8. Acceptance Test

```
[Migration]
1. 0006 SQL 실행 → templates 9개 생성 + 기존 slides.layout 매핑
2. 데모 게시물 진입 → 시각 깨짐 없음 확인

[Library 템플릿 탭]
3. /library → 템플릿 탭 → 9개 카드 미리보기 표시
4. "data_card" 활성 OFF → 디자인 페이지에서 해당 옵션 사라짐
5. 다시 ON → 다시 보임

[Design 페이지]
6. 슬라이드 선택 → 9개 (또는 active 템플릿 수만큼) 옵션 → 클릭 시 시각 변화
7. ★ 표시가 슬라이드 principle과 매칭되는 템플릿에 표시

[AI 생성]
8. 새 게시물 → 주제·팩트 입력 → 생성
9. 9개 슬라이드 layout이 principle별 기본 템플릿으로 채워짐 (DB 확인)
10. 동일 principle 연속 슬라이드는 교차 (msg_left ↔ msg_right)

[ZIP/Preview]
11. 미리보기 페이지 → 캐러셀 + 폰 목업 시각 확인
12. ZIP 다운로드 → PNG 9장 정확히 렌더

[Build]
13. npm run build 통과
```

---

## 9. Open Questions

| Q | 답 |
|---|---|
| 사용자 정의 템플릿 (BEN이 새로 만들기) | OUT (nice-to-have, 추후 별도) |
| AI가 layout 추천을 무시하고 자기가 결정 | OUT (server action에서 결정, AI는 main_text만) |
| 9개로 충분? | 일단 9개로 시작 → BEN 사용 패턴 보고 추가/제거 |
| compare_box / checklist 의 데이터 구조 | emphasis 배열 활용 (없으면 메인 텍스트 줄바꿈 split, fallback) |

---

## Next: Do 단계

`/pdca do slide-templates` → 5~7시간 분량.

모듈 분할 권장:
- `module-1`: 마이그레이션 + 9개 템플릿 시드 (DB 안정 확보)
- `module-2`: SlideCanvas 9개 시각 구현 (가장 큰 변경)
- `module-3`: 라이브러리 탭 + active 토글
- `module-4`: 디자인 페이지 active 필터 + AI 자동 추천

`/pdca do slide-templates --scope module-1,module-2` 식으로 단계별 가능.
