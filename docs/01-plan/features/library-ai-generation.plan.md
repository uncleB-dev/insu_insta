# Plan: library-ai-generation

> 라이브러리 페이지에서 직접 AI(Nano Banana) 이미지를 생성해 스톡으로 쌓아두는 기능.

| Field | Value |
|---|---|
| Feature | `library-ai-generation` |
| Phase | Plan |
| Created | 2026-04-28 |
| Author | BEN |
| Type | Enhancement (UI extension, no schema change) |
| Estimated effort | ~1.5~2시간 |

---

## Executive Summary

| 관점 | 요약 |
|---|---|
| **Problem** | AI 이미지 생성(Nano Banana)은 디자인 페이지의 특정 슬라이드용으로만 호출됨. 미리 만들어두고 여러 게시물에서 재사용하는 "스톡 쌓기" 흐름 부재. |
| **Solution** | 라이브러리 페이지에 "🎨 AI 생성" 버튼 추가. 프롬프트 입력 모달 → Nano Banana 1장 생성 → Storage 업로드 → library_photos에 등록. 선택적으로 "유사 프롬프트로 3장 더" 일괄 생성 버튼. |
| **Function/UX Effect** | 스톡 라이브러리를 시간 날 때 미리 채워둠. 게시물 작성 시 디자인 단계에서 이미 적합한 배경이 있는지 라이브러리 시트에서 즉시 선택 가능. |
| **Core Value** | 게시 작성 시간 ↓ (배경 즉석 생성 → 라이브러리 픽), 동일 톤 일관성 ↑ (같은 스타일로 미리 생성한 사진 재사용). |

---

## Context Anchor

| Anchor | Content |
|---|---|
| **WHY** | 스톡 사진을 하나씩 매번 만들지 말고 라이브러리에 미리 모아두면 게시 작성이 빨라지고 시각 일관성도 높아짐. |
| **WHO** | BEN (1인) — 시간 날 때 라이브러리에 사진을 충전해두고, 게시 작성 시 빠르게 배경 픽. |
| **RISK** | (1) Nano Banana 비용 ($0.039/장) — 무분별한 생성 차단 필요, (2) 동일 프롬프트 반복 호출로 거의 같은 사진 누적, (3) 생성 실패 시 사용자 혼란. |
| **SUCCESS** | (a) 라이브러리에서 "🎨 AI 생성" 클릭 → 프롬프트 입력 → 10~20초 후 라이브러리 그리드 상단에 새 사진 등장 (b) 생성 후 "유사 프롬프트로 3장 더" 클릭 → 다양한 변형 추가 (c) 디자인 페이지의 라이브러리 시트에서 자동 노출 (d) 비용 ~$0.039/장 안내 표시. |
| **SCOPE** | IN: 라이브러리 페이지 AI 생성 모달, 단일 + 일괄(3장) 호출, 진행 상태 + 비용 안내. 기존 generateBackgroundAction 재사용. OUT: 스타일 프리셋, 생성 결과 비교 UI, 프롬프트 히스토리, 이미지 편집/리터치. |

---

## 1. Background

### 현 상태
- `generateBackgroundAction` (design page)는 다음 시그니처:
  ```ts
  generateBackgroundAction({
    prompt: string;
    slideId?: string;
    bindToSlide?: boolean;  // default true
  }) → { photo?: { id, src }; error? }
  ```
- 즉 **이미 `bindToSlide: false` 옵션을 받도록 설계**되어 있음 → 라이브러리에서 호출 시 추가 코드 거의 없음
- 라이브러리 페이지(`LibraryClient.tsx`)는 이미 업로드/삭제 흐름 + 그리드 UI 보유 → 모달 1개만 추가하면 됨

### 비용 참고
- Nano Banana (gemini-2.5-flash-image): 약 $0.039/이미지
- 1일 평균 5~10장 생성 시 월 $5~12 수준 (적정)
- 일괄 4장(1+3) 한 번에 = $0.156

---

## 2. Requirements

### Functional

**FR-1** 라이브러리 페이지 상단(또는 ＋ 업로드 옆)에 **🎨 AI 생성** 버튼 추가.

**FR-2** 클릭 시 모달:
- 프롬프트 입력 textarea (multi-line, 자유 입력)
- 1차 생성: "✨ 생성" 버튼 1개
- 비용 안내: "1장당 약 $0.039 (Gemini Nano Banana)"
- 취소 / 닫기 버튼

**FR-3** 생성 진행:
- 버튼 disabled + "🎨 생성 중… (10~20초)" 라벨
- Nano Banana 호출 → Storage 업로드 → library_photos insert (모두 server action 1회)

**FR-4** 생성 성공:
- 라이브러리 그리드 상단에 새 사진 즉시 추가 (optimistic)
- 모달이 자동으로 후속 액션 모드로 전환:
  - 새로 생성된 사진 미리보기 표시
  - "🎨 유사 프롬프트로 3장 더" 버튼 (배치 생성)
  - "✨ 다른 프롬프트로 1장 더" 버튼
  - "닫기" 버튼

**FR-5** 일괄 3장 생성:
- 동일 프롬프트로 3회 순차 호출 (Gemini 응답 다양성 확보를 위해 약간씩 prompt 변형:
  ` + " variation A"`, `" variation B"`, `" variation C"` 같은 suffix)
- 각 결과 즉시 그리드에 추가 (3장 모두 다른 결과로 나옴)
- 진행률 "(2/3 완료)" 식으로 표시

**FR-6** 생성된 사진은 `source = 'upload'`로 저장 (정확히는 AI 생성이지만, 기존 enum 값 재사용. 추후 `'ai'` 값 추가 검토).
- 라이브러리 sheet/그리드에서 동일하게 노출

### Non-Functional

**NFR-1** 단일 생성 응답 시간 ≤ 25초
**NFR-2** 일괄 3장 생성 응답 시간 ≤ 75초 (3 × 25초)
**NFR-3** 모달 열린 동안 이중 클릭 방지 (busy 플래그)
**NFR-4** 실패 시 명확한 에러 토스트 + 모달은 닫지 않음 (재시도 가능)

---

## 3. Constraints

- DB 스키마 변경 없음 (`library_photos` 그대로 사용, source = 'upload')
- 신규 server action 없음 — 기존 `generateBackgroundAction({ bindToSlide: false })` 재사용
- 모달 UI는 `DesignEditorClient`의 AI 모달과 90% 유사 → 재사용 또는 분리 컴포넌트로 추출

---

## 4. Success Criteria

| ID | Criteria | Verification |
|---|---|---|
| SC-1 | 라이브러리 페이지에 🎨 AI 생성 버튼 노출 | 시각 |
| SC-2 | 모달에서 프롬프트 입력 → ✨ 생성 → 라이브러리 그리드 상단에 새 사진 추가 | 수동 |
| SC-3 | 생성 후 "유사 프롬프트로 3장 더" 버튼 → 3장 순차 추가 (진행률 표시) | 수동 |
| SC-4 | 디자인 페이지의 라이브러리 시트에 새 사진 즉시 노출 | 수동 |
| SC-5 | 비용 안내 "$0.039/장" 모달 하단에 표시 | 시각 |
| SC-6 | 생성 실패 시 에러 토스트 + 모달 유지 + 재시도 가능 | 의도적 실패 |
| SC-7 | 기존 라이브러리 업로드/삭제 흐름 회귀 X | 수동 |
| SC-8 | `npm run build` 통과 | 빌드 |

---

## 5. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| 사용자가 빠르게 여러 번 클릭 → 비용 폭증 | 비용 ↑ | 중 | 모달 busy 플래그로 동시 호출 차단 + 일괄은 명시적 "3장 더" 버튼만 |
| Gemini API 일시 장애 | 사용자 혼란 | 낮음 | 명확한 에러 토스트 + 모달은 유지 (재시도) |
| 일괄 3장 중 1~2장만 성공 | 부분 실패 | 중 | 성공한 것만 그리드 추가 + "(2/3 완료, 1장 실패)" 표기 |
| 생성된 사진이 거의 동일 (variation 약함) | 사용자 만족도 ↓ | 중 | 프롬프트에 "variation A/B/C" 같은 마커 추가 + temperature 살짝 다르게(추후) |
| source enum이 'upload'면 진짜 업로드와 구분 안 됨 | 통계 품질 ↓ | 낮음 | 추후 enum에 'ai' 추가하는 마이그레이션 별도 진행 (이번 OUT) |

---

## 6. Out of Scope

- 스타일 프리셋 ("미니멀", "광고 사진" 등 1클릭 템플릿)
- 생성 전 프리뷰 / 재생성 단계
- 프롬프트 히스토리 저장
- 이미지 편집(크롭, 필터)
- AI 이미지 source enum 별도 추가 (`'ai'`)
- 일괄 N장 자유 선택 (1+3 고정)
- 사용량 / 월 비용 대시보드

→ 별도 feature로 분리.

---

## 7. Implementation Outline

### 7.1 신규 파일 0개
DB·server action 추가 없음 (기존 `generateBackgroundAction` 재사용)

### 7.2 수정 파일 1개
**`studio/src/components/library/LibraryClient.tsx`**:
- 새 state: `showAiModal`, `aiPrompt`, `aiBusy`, `aiPhase` ('idle' | 'generated'), `lastGeneratedPhoto`, `batchProgress`
- 새 함수: `handleGenerateAi()` (단일), `handleBatchAi()` (3장 순차)
- `<button>🎨 AI 생성</button>` 헤더에 추가 (＋ 업로드 옆)
- 모달 JSX:
  - phase = 'idle': 프롬프트 textarea + ✨ 생성 버튼
  - phase = 'generated': 마지막 결과 미리보기 + "3장 더" + "다른 프롬프트로 1장 더" + 닫기
- 비용 안내 fixed footer

### 7.3 변경 예상 라인
- 추가 ~180 lines (모달 + 핸들러)
- 수정 ~10 lines (헤더 버튼 추가)

---

## 8. Acceptance Test (수동)

```
1. /library 진입
2. 헤더에 🎨 AI 생성 버튼 보이는지 (＋ 업로드 왼쪽)
3. 클릭 → 모달 → 프롬프트 입력
   "한국 아파트 단지, 늦가을 노을, 따뜻한 톤, 인스타 카드뉴스 배경, 1:1, 텍스트 영역 비워둔 깔끔한 구성"
4. ✨ 생성 클릭 → 10~20초 후 라이브러리 그리드 상단에 새 사진 등장
5. 모달이 후속 액션 모드로 전환
6. 🎨 유사 프롬프트로 3장 더 클릭 → 진행률 1/3, 2/3, 3/3 표시 → 3장 추가
7. 모달 닫기 → 그리드에 총 4장 추가됨 확인
8. 게시물 디자인 페이지 → 🖼️ 라이브러리 시트 → 방금 4장 노출 확인
9. 일부러 빈 프롬프트로 ✨ 생성 → 에러 토스트 → 모달 유지 → 재시도 가능
10. npm run build 통과
```

---

## 9. Open Questions

| Q | 답 |
|---|---|
| 일괄 생성 시 동시(parallel) vs 순차(sequential) | **순차** (Gemini rate limit 방지 + UI 진행률 표시 쉬움) |
| 생성 후 자동으로 슬라이드에 적용? | **아니오** (라이브러리는 스톡 쌓기 목적, 적용은 디자인 페이지에서) |
| 스타일 프리셋 | **이번 OUT** (자유 프롬프트만, 추후 검토) |
| 비용 안내 정확도 | **고정 $0.039 안내** (실시간 비용 추적은 별도 feature) |

---

## Next: Do 단계

`/pdca do library-ai-generation` 시 1.5~2시간 분량으로 한 번에 가능.
