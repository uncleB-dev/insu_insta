# Plan: design-font-size

> 이미지 합성(디자인) 페이지에서 슬라이드 텍스트의 **글자 크기 + 줄 간격**을 슬라이드별로 조절 가능하게 한다.

| Field | Value |
|---|---|
| Feature | `design-font-size` |
| Phase | Plan |
| Created | 2026-04-28 |
| Author | BEN |
| Type | Enhancement (UI + DB schema) |
| Estimated effort | ~2~3시간 |

---

## Executive Summary

| 관점 | 요약 |
|---|---|
| **Problem** | 디자인 페이지에서 메인/보조 텍스트 글자 크기가 레이아웃에 따라 고정되어 있어, 짧은 메시지는 텍스트가 빈약하고 긴 메시지는 박스 밖으로 잘리거나 글자가 작아 가독성이 떨어짐. |
| **Solution** | 우측 옵션 패널에 슬라이더 3개(메인 크기 / 보조 크기 / 줄 간격)를 추가. 슬라이드별 DB 저장. null이면 레이아웃 기본값을 fallback으로 사용. |
| **Function/UX Effect** | 700ms 디바운스 자동저장 + 즉시 미리보기 반영 + 1080×1080 ZIP 다운로드에도 정확히 반영. "기본값 복원" 버튼으로 언제든 되돌리기 가능. |
| **Core Value** | 슬라이드별 텍스트 길이가 달라도 시각적 균형을 작가가 직접 맞출 수 있게 됨 → 인스타 카드뉴스의 가독성·완성도 한 단계 상승. |

---

## Context Anchor

| Anchor | Content |
|---|---|
| **WHY** | 텍스트 길이가 슬라이드마다 달라 고정 폰트로는 박스 균형이 깨짐. 사용자(BEN)가 매 카드마다 미세 조정을 원함. |
| **WHO** | 보험삼촌 BEN's Studio 운영자(BEN) — 본인 전용 도구, 1인 사용. |
| **RISK** | (1) 큰 폰트 + 긴 텍스트 → 박스 밖 넘침 / 잘림. (2) ZIP 1080×1080 스케일링 시 슬라이더 값과 시각 결과 불일치. (3) DB null vs 명시 0 혼동. |
| **SUCCESS** | (a) 슬라이더 조작 1초 내 미리보기 반영 (b) 자동저장 후 새로고침 유지 (c) ZIP PNG 9장의 폰트 크기가 슬라이더 값과 비례 일치 (d) "기본값 복원" 클릭 시 레이아웃 기본값으로 즉시 되돌아감. |
| **SCOPE** | IN: 메인/보조 폰트 크기, 줄 간격, 슬라이드별 저장, 전체 적용 토글 호환, ZIP 반영. OUT: 폰트 패밀리 변경, 글자 간격(letter-spacing), 텍스트 색상 개별, 폰트 굵기 변경. |

---

## 1. Background

현재 디자인 페이지(`/posts/[id]/design`) 우측 옵션 패널은 다음 항목만 조절 가능:
- 레이아웃 템플릿 (A~I, 9종)
- 흐림 강도 (0~20px)
- 어두운 오버레이 (0~90%)
- 텍스트 위치 (상/중/하)
- 강조 컬러 (4색)

`SlideCanvas` 컴포넌트가 레이아웃 ID에 따라 폰트 크기를 하드코딩:
- A/B (카톡): `fontSize: px(20)`
- C (Q&A): `fontSize: px(22)`
- D~I (풀블리드/인용/리스트 등): `fontSize: px(28)`
- 보조 텍스트(sub): 모든 레이아웃 `px(13)`
- 줄 높이: 메인 `1.4` 또는 `1.35`, 보조 `1.35`

문제: 텍스트가 짧으면 빈약, 길면 잘림. 슬라이드별 미세 조정 불가.

---

## 2. Requirements

### Functional

**FR-1. 메인 폰트 크기 슬라이더**
- 위치: 우측 옵션 패널, "강조 컬러" 위에 배치
- 범위: 16px ~ 64px, step 1px
- 표시: 우측에 현재 값 (예: `24px`)
- 슬라이더 옆에 "↺ 기본값" 텍스트 버튼 → null로 리셋

**FR-2. 보조 폰트 크기 슬라이더**
- 범위: 10px ~ 32px, step 1px
- 동일 구성

**FR-3. 줄 간격 슬라이더**
- 범위: 1.0 ~ 2.0, step 0.05
- 표시: 소수점 둘째 자리까지 (예: `1.40`)
- 메인+보조 텍스트에 동시 적용 (단순화)

**FR-4. DB 저장**
- 슬라이더 변경 → 700ms 디바운스 → `updateSlideDesignAction` 호출
- "전체 슬라이드 적용" 토글 ON일 때 → `applyDesignToAllAction`

**FR-5. 기본값 fallback**
- DB 컬럼은 nullable
- null일 때 `SlideCanvas`가 레이아웃별 기본값 사용 (현재 하드코딩 값과 동일)
- "↺ 기본값" 클릭 → 해당 필드를 null로 update

**FR-6. 미리보기 반영 범위**
- 디자인 페이지 중앙 미리보기 (540px) ✓
- 좌측 썸네일 (~120px) ✓
- 미리보기 페이지 캐러셀 (540px) ✓
- 폰 목업 (~272px) — 메인 카드만, 폰트 단순화 가능
- ZIP 다운로드 (1080×1080) ✓ — 비율 정확히 스케일

### Non-Functional

**NFR-1.** 슬라이더 입력 → 미리보기 반영 ≤ 1초 (debounce 700ms 후 즉시)
**NFR-2.** 기존 데이터(컬럼 null)는 시각적 변화 없음 (backward compat)
**NFR-3.** 빌드 시간 +0.5초 이내, 번들 크기 +5KB 이내
**NFR-4.** RLS 정책 변경 없음 (기존 slides_owner_all 그대로 적용)

---

## 3. Constraints

- **DB 마이그레이션**: 사용자가 SQL Editor에서 직접 실행 (Supabase MCP 연결 불가)
- **타입 안전성**: 현재 Database 제네릭이 비활성화되어 있음 (Phase A1+A2 결정). 변경 후에도 same 패턴 유지.
- **ZIP 캐스케이드**: `SlideCanvas` 변경은 디자인 페이지 + 미리보기 캐러셀 + ZIP 모두에 동일하게 영향. 한 곳에서 수정하면 모두 반영.
- **레이아웃 기본값**: 현재 하드코딩 값(20/22/28)을 유지해야 기존 작업물이 시각적으로 깨지지 않음.

---

## 4. Success Criteria

| ID | Criteria | Verification |
|---|---|---|
| SC-1 | 메인 슬라이더 16→64 조작 시 미리보기·썸네일·폰목업이 1초 내 반영 | 수동 테스트 |
| SC-2 | 보조 슬라이더 동일 동작 | 수동 테스트 |
| SC-3 | 줄 간격 슬라이더 동일 동작 | 수동 테스트 |
| SC-4 | 새로고침 후 슬라이더 값 유지 | 수동 테스트 |
| SC-5 | "↺ 기본값" 클릭 시 레이아웃별 기본값으로 즉시 되돌아감 | 수동 테스트 |
| SC-6 | "전체 슬라이드 적용" 토글 ON에서 슬라이더 조작 시 모든 슬라이드 동시 변경 | 수동 테스트 |
| SC-7 | ZIP 다운로드 PNG 9장의 텍스트 폰트 크기가 슬라이더 값과 비례 일치 | 다운로드 후 이미지 검사 |
| SC-8 | 기존 데이터(컬럼 null)에서 시각적 변화 없음 | 마이그레이션 직후 기존 게시물 확인 |
| SC-9 | `npm run build` 통과 (TypeScript 에러 0) | 빌드 |

---

## 5. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| 큰 폰트 + 긴 텍스트 → 박스 밖 넘침 | 시각적 깨짐 | 중 | `SlideCanvas`에 `overflow: hidden` + `word-break: keep-all`. 슬라이더 max를 64px로 제한. 사용자가 너무 크면 직접 줄임. |
| ZIP 1080×1080 스케일링에서 폰트 크기 비율 어긋남 | 작업물과 결과물 불일치 | 낮음 | `px(n)` 헬퍼가 이미 `size/540` 비율로 적용 중 → 슬라이더 값도 동일 헬퍼 통과시키면 자동 정확. |
| nullable 컬럼 + UI 슬라이더 default 값 동기화 | 슬라이더가 항상 값 표시해야 하는데 null 일 때 표시 깨짐 | 중 | `effectiveValue = slide.main_font_size ?? defaultFor(layout)` 헬퍼로 항상 number 보장. |
| 기본값과 명시값 시각 구분 어려움 | UX 혼동 | 낮음 | 슬라이더 옆 라벨에 `(기본)` 표기 (값이 null일 때) 또는 슬라이더 색상 살짝 흐림. |
| 자동저장 충돌 (3개 슬라이더 동시 조작) | 중간 패치 손실 | 낮음 | 기존 `updateSlideDesignAction` debouncer가 슬라이드 단위로 patch merge — 그대로 작동. |

---

## 6. Out of Scope

- 폰트 패밀리 변경 (Pretendard 고정)
- 글자 간격 (letter-spacing)
- 메인/보조 텍스트 색상 개별 변경
- 폰트 굵기(weight) 가변
- 텍스트 정렬(left/center/right) — 현재 레이아웃 종속
- 텍스트 그림자 강도 조절

→ 추후 별도 feature로 분리 가능.

---

## 7. Implementation Outline (Design 단계에서 상세화)

### 7.1 DB 마이그레이션 (사용자 실행 필요)
- `studio/supabase/migrations/0004_font_size_fields.sql`
- `slides` 테이블에 추가:
  - `main_font_size smallint` (nullable)
  - `sub_font_size smallint` (nullable)
  - `line_height numeric(3,2)` (nullable)

### 7.2 코드 변경 영역

**Backend / 데이터 흐름**
- `studio/src/lib/supabase/types.ts` — SlideRow / Insert / Update에 3개 필드 추가
- `studio/src/app/(chrome)/posts/[id]/design/actions.ts` — `DesignPatch` 타입 확장
- `studio/src/lib/preview.ts` — 새 필드 join + PreviewSlide에 포함

**렌더링 (단일 출처)**
- `studio/src/components/post/SlideCanvas.tsx`:
  - props에 `main_font_size?`, `sub_font_size?`, `line_height?` 추가 (CanvasSlide 타입 확장)
  - `effectiveMain(layout, override)` / `effectiveSub(override)` / `effectiveLineHeight(override)` 헬퍼
  - 모든 fontSize 하드코딩 위치를 헬퍼 통해 결정

**디자인 페이지 UI**
- `studio/src/components/post/DesignEditorClient.tsx`:
  - DesignSlide 타입 확장
  - 3개 슬라이더 + 3개 ↺ 버튼 추가
  - editSelected 호출 시 새 필드 patch

**미리보기 페이지**
- 자동 반영 (SlideCanvas 사용 중)
- 추가 작업 없음

### 7.3 변경 예상 파일 (7개)
- 신규: 1 (migration SQL)
- 수정: 6 (types, design/actions, preview lib, SlideCanvas, DesignEditorClient, design/page.tsx)

### 7.4 변경 예상 라인
- 추가 ~250 lines
- 수정 ~80 lines
- 삭제 ~10 lines (하드코딩 fontSize 제거)

---

## 8. Acceptance Test (수동)

1. 마이그레이션 0004 실행
2. https://insu-insta.vercel.app/posts/<demo>/design 진입
3. 슬라이드 1 선택 → 메인 슬라이더를 16 → 64로 천천히 조작 → 미리보기 변화 확인
4. 줄 간격 1.0 → 2.0 조작 → 줄 간격 변화 확인
5. ↺ 기본값 클릭 → 텍스트가 즉시 원래 크기로 돌아오는지
6. F5 새로고침 → 슬라이더 값 + 미리보기 유지
7. "전체 슬라이드 적용" 체크 → 슬라이더 조작 → 9장 모두 변화
8. 미리보기 페이지 진입 → 캐러셀에서 동일 결과 확인
9. ZIP 다운로드 → PNG 추출 → 글자 크기가 슬라이더 값과 비례 일치 확인
10. `npm run build` 통과

---

## 9. Open Questions

| Q | 답 |
|---|---|
| 폰트 크기 단위는 px? rem? | **px** (1080×1080 고정 캔버스라 px가 직관적) |
| 줄 간격은 메인/보조 통합? 별도? | **통합** (단순화, 보조는 보통 짧은 한 줄이라 영향 적음) |
| AI 자동 추천(텍스트 길이 보고) | **OUT** (이번 범위 밖) |
| 폰트 색상 개별 조절 | **OUT** |

---

## Next: Design 단계

`/pdca design design-font-size` → 3가지 아키텍처 옵션 중 선택 후 상세 구현 가이드 작성.
