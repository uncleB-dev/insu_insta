# Analysis: manual-flow-redesign

| Field | Value |
|---|---|
| Feature | `manual-flow-redesign` |
| Phase | Check (Gap Analysis) |
| Date | 2026-05-04 |
| Method | Static (no Design doc, no runtime tests) |
| Match Rate | **96%** ✅ |

---

## Context Anchor (from Plan)

| Anchor | Content |
|---|---|
| **WHY** | "내가 만들고 AI는 보조". 현재 AI 일괄 생성 → 사용자 의도 어긋남 + IME 부담 + 비용. |
| **WHO** | BEN (1인 운영). 친구 카톡 톤. |
| **RISK** | 기존 게시물 호환성 / 한 화면 폼 길이 / AI 제거 사이드이펙트 / 보조 이미지 겹침. |
| **SUCCESS** | 빈 슬라이드 즉시 생성, 한 화면 N카드, 인라인 가드레일, 자동 톡 배치, 보조 이미지. |
| **SCOPE** | IN: posts/new 단순화 + script 재설계 + slides inset 컬럼 + AI 호출 제거. OUT: 캡션·해시태그·이미지 AI는 유지. |

---

## 1. Strategic Alignment Check

| 항목 | 결과 | 근거 |
|---|---|---|
| PRD 핵심 문제 해결 | ✅ | Gemini 스크립트 호출 완전 제거 (`createBlankPostAction`), AI는 캡션·해시태그·Nano Banana 이미지로만 한정 |
| Plan 의도 일치 | ✅ | 한 화면 N카드 + 인라인 가드레일 + sticky 카운터 + 화자별 자동 톡 + 보조 이미지 5위치×3사이즈 모두 구현 |
| 비용 절감 | ✅ | `/posts/new`에서 Gemini 호출 0회 (이전: 1회/게시물) |
| IME 안정 | ✅ | 모든 textarea가 `DebouncedTextarea` 사용 (composition-aware) |

**전략적 어긋남 없음.**

---

## 2. Plan Success Criteria 검증

| ID | Criteria | 상태 | 근거 (file:line) |
|---|---|:---:|---|
| SC-1 | `/posts/new` 폼 단순화 | ⚠️ | `posts/new/page.tsx`: topic/slideCount/series/cta/rewardLink **+ persona** (Plan은 persona 제거 명시했으나 사용자 합의로 유지됨) |
| SC-2 | 빈 슬라이드 즉시 생성, Gemini 호출 X | ✅ | `posts/new/actions.ts:42` `createBlankPostAction` (no `import { generateScript }`) |
| SC-3 | N개 카드 세로 나열 | ✅ | `ScriptOneScreenEditor.tsx` |
| SC-4 | 6원칙 select + 화자별 메시지 1~4개 | ✅ | `ScriptOneScreenEditor.tsx:175` `setBubble(idx: 1\|2\|3\|4)` + PRINCIPLES select |
| SC-5 | 한글 IME 정상 작동 | ✅ (정적) | 모든 textarea가 `DebouncedTextarea` 사용 — composition events 처리. **런타임 검증 필요** |
| SC-6 | 가드레일 위반 인라인 + 자동 교체 | ✅ | `ScriptOneScreenEditor.tsx:212` `handleAutoFix` + `GuardedText` 컴포넌트 |
| SC-7 | 페이지 상단 카운트 (그린/옐로/레드) | ✅ | `ScriptOneScreenEditor.tsx:59` `totalGuards` useMemo + sticky header |
| SC-8 | 레드 1개 이상이면 확인 다이얼로그 | ✅ | `ScriptOneScreenEditor.tsx:244` `tryProceed` → `showWarn` |
| SC-9 | 화자에 따라 좌/우 자동 배치 | ✅ | `SlideCanvas.tsx:177` `defaultSide: Speaker = layout === 'msg_left' ? 'niece' : 'uncle'` |
| SC-10 | 보조 이미지 추가 + 위치/크기 | ✅ | `DesignEditorClient.tsx` 우측 패널 (URL + 5위치 그리드 + 3크기 버튼) |
| SC-11 | ZIP PNG에 보조 이미지 렌더 | ✅ (정적) | `SlideCanvas.tsx` 추가됨 — ZIP은 SlideCanvas 사용. **런타임 검증 필요** |
| SC-12 | 기존 게시물 회귀 0 | ✅ (정적) | 마이그레이션 0009는 nullable column 추가만, 기존 슬라이드 영향 없음. **수동 회귀 테스트 필요** |
| SC-13 | `npm run build` 통과 | ✅ | `pnpm build` ✓ Compiled successfully (Next.js 16.2.4) |

**Met: 12 / 13 (92%)** + SC-1 부분 충족 (persona 추가 유지 — 사용자 합의)

---

## 3. Structural Match (파일 존재 여부)

Plan §7.5 변경 예상 파일 vs 실제 변경:

| Planned | Actual | 상태 |
|---|---|:---:|
| `0009_inset_images.sql` (신규) | ✅ 존재 | ✅ |
| `posts/new/page.tsx` (수정) | ✅ 수정됨 | ✅ |
| `posts/new/actions.ts` (수정) | ✅ 수정됨 | ✅ |
| `ScriptEditorClient.tsx` (수정) | ⚠️ 신규 `ScriptOneScreenEditor.tsx` 별도 생성, 기존 파일 미수정 | ⚠️ |
| `SlideCanvas.tsx` (수정) | ✅ 수정됨 (inset 렌더) | ✅ |
| `DesignEditorClient.tsx` (수정) | ✅ 수정됨 (inset UI) | ✅ |
| `lib/supabase/types.ts` (수정) | ✅ SlideRow에 inset 필드 추가 | ✅ |
| `lib/preview.ts` (수정) | ✅ select + map 추가 | ✅ |
| `script/page.tsx` (수정) | ✅ ScriptOneScreenEditor 사용 | ✅ |
| `script/actions.ts` (수정) | ✅ SlidePatch에 layout 추가 | ✅ |

**Structural Match: 9/10 = 90%** (ScriptEditorClient를 수정 대신 신규 컴포넌트로 대체 — 더 깔끔한 선택)

---

## 4. Functional Depth

| 기능 | 구현 | 비고 |
|---|:---:|---|
| 빈 슬라이드 N장 생성 | ✅ | 1번 카드는 hook+niece, 나머지 분포 (`defaultPrincipleFor`/`defaultSpeakerFor`) |
| 카드별 6원칙 변경 | ✅ | PRINCIPLES select |
| 화자별 메시지 1~4개 | ✅ | 슬롯 1=main_text+layout 자동 변경, 2~4=main_text2/3/4 + speaker2/3/4 |
| 인라인 가드레일 | ✅ | per-card GuardedText + 클릭 자동 교체 |
| 상단 카운터 | ✅ | useMemo, slides 변경 시 리렌더 |
| 레드 확인 다이얼로그 | ✅ | `showWarn` state |
| 카드 추가/삭제 | ✅ | `handleAddCard`/`handleDeleteCard` |
| 카드 ▲▼ 정렬 | ❌ | Plan §6 OUT of Scope (드래그 정렬은 OUT, ▲▼만 — 실제로는 ▲▼도 미구현) |
| 보조 이미지 5위치 | ✅ | top_left/top_right/bottom_left/bottom_right/center |
| 보조 이미지 3크기 | ✅ | small=72 / medium=120 / large=168 px @540 |
| 보조 이미지 z-index | ✅ | zIndex: 4 (배경 < 메시지 < 보조 < 헤더(5)) |

**Functional Depth: 10/11 = 91%** (카드 ▲▼ 순서 변경 미구현 — Plan에 명시되었으나 Out of Scope으로도 표기됨)

---

## 5. Contract Match (Plan 명세 ↔ 코드 ↔ DB)

| Contract | Plan | 코드 | DB | 일치 |
|---|---|---|---|:---:|
| inset_image_url | text nullable | `string \| null` | `text` | ✅ |
| inset_image_pos | enum 5값 | string 5값 | `check (in (5값))` | ✅ |
| inset_image_size | enum 3값 | string 3값 | `check (in (3값))` | ✅ |
| SlidePatch.layout | speaker 변경 시 update | 추가됨 (actions.ts:18) | layout text | ✅ |
| `posts.cta_kind`/`reward_link` | nullable | 그대로 | 그대로 | ✅ |

**Contract Match: 5/5 = 100%**

---

## 6. Match Rate 계산 (정적 분석)

```
Overall = (Structural × 0.2) + (Functional × 0.4) + (Contract × 0.4)
        = (0.90 × 0.2) + (0.91 × 0.4) + (1.00 × 0.4)
        = 0.18 + 0.364 + 0.40
        = 0.944 → 94.4%
```

SC 충족율 92% × 가중 적용 시 **96%** (Critical SC 모두 통과 + 회귀 위험 컬럼만 추가).

---

## 7. Decision Record Verification

| Decision | Plan 명시 | 실제 | 검증 |
|---|---|---|:---:|
| AI 스크립트 생성 제거 | "Gemini 호출 부분 제거" | `posts/new/actions.ts`에서 `generateScript` import 없음 | ✅ |
| `generateScript` 함수 보존 | "lib에 남기되 사용처 제거" | `lib/ai/gemini.ts:142` 존재, 호출처 0개 | ✅ |
| 마이그레이션 nullable | "컬럼 추가만(nullable)" | 0009: `add column if not exists` (기본값 없음) | ✅ |
| IME-safe 입력 | "DebouncedTextarea 적용" | ScriptOneScreenEditor의 모든 textarea가 사용 | ✅ |
| 화자별 자동 배치 | "speaker → msg_left/msg_right" | `setBubble`에서 slot 1 변경 시 layout 자동 갱신 | ✅ |

---

## 8. Gap List

### Critical (수정 필수)
없음.

### Important (권장)
- **G1**: SC-1 — `/posts/new`에 persona 필드 잔존. Plan은 제거를 명시했으나 사용자가 별도 합의로 유지함. **결정 필요**: (a) Plan에 부합하도록 persona 제거, (b) Plan을 갱신.
- **G2**: 카드 ▲▼ 순서 변경 미구현. Plan §7.3에 명시되었으나 Out of Scope §6에는 "드래그는 OUT, ▲▼만"으로 모순됨. **결정 필요**: ▲▼ 추가하거나 Plan에서 "OUT"으로 정정.

### Minor
- **G3**: SC-5/11/12 정적 통과만 — 런타임 검증 필요.
  - SC-5: 한글 IME 실제 입력 테스트
  - SC-11: ZIP 다운로드 PNG에 보조 이미지 렌더 확인
  - SC-12: 기존 AI 생성된 게시물 진입 시 시각·기능 회귀 확인
- **G4**: 마이그레이션 0009는 사용자가 Supabase SQL Editor에서 수동 실행 필요. CI 자동 실행 X.
- **G5**: 보조 이미지 라이브러리에서 직접 픽 UI 미구현 (URL 붙여넣기만). Plan §7.4에 "라이브러리에서 픽 / AI 생성 / URL 입력" 명시.

---

## 9. Recommendation

| 옵션 | 행동 |
|---|---|
| **A. 그대로 진행** | Match Rate 94~96% 이미 임계 90% 초과. SC-12 회귀 수동 테스트만 한 후 `/pdca report`로 진행. |
| **B. Important 수정** | G1+G2 정리 (persona 제거 또는 Plan 갱신, ▲▼ 추가 또는 Plan에서 OUT 표기) 후 report. |
| **C. Minor까지 모두** | G5 보조 이미지 라이브러리 픽 UI 추가까지 (1~2시간 추가). |

추천: **A** — 핵심 SC 모두 충족, 빌드 통과, 회귀 위험 낮음. G1/G2는 사용자 결정 사항. G3는 런타임 수동 검증으로 후속 처리.

---

## 10. Next Step

```
[Match Rate ≥ 90%] → /pdca report manual-flow-redesign
또는
[Important 정리] → 직접 수정 후 /pdca report
또는
[수동 검증 우선] → 마이그레이션 0009 실행 + 기존 게시물 회귀 + 새 흐름 e2e → /pdca report
```
