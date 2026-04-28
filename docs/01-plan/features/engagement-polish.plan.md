# Plan: engagement-polish

> 게시물 완성도와 인스타그램 인게이지먼트를 한 단계 끌어올리는 3-기능 패키지.

| Field | Value |
|---|---|
| Feature | `engagement-polish` |
| Phase | Plan |
| Created | 2026-04-28 |
| Author | BEN |
| Type | Feature pack (3 features × 1 plan) |
| Estimated effort | ~5~7시간 |

---

## Executive Summary

| 관점 | 요약 |
|---|---|
| **Problem** | (1) 현재 CTA가 "저장/공유/DM/링크" 4종뿐이라 댓글로 적극 참여를 유도하고 추가 자료를 보내는 깔때기 부재. (2) 캡션·해시태그를 매번 손으로 적어야 해서 발행 직전 시간 소모. (3) Pretendard 단일 폰트가 사무적으로 보여 친근한 "삼촌" 톤과 시각적 거리감. |
| **Solution** | (1) CTA 옵션 "댓글 유도" 추가 + 게시물별 reward_link 1개. (2) Gemini grounded search로 캡션(500자±) + 해시태그(7개+) 자동 생성, 미리보기 페이지에서 원클릭 호출 후 편집. (3) 슬라이드 캔버스(1080×1080)에만 Gmarket Sans 적용 — 관리 UI는 Pretendard 유지. |
| **Function/UX Effect** | "스크립트 생성 → 디자인 → AI 캡션·해시태그 ✨ → 발행" 흐름이 매끄럽게 이어지고, 댓글 유도 CTA 모드 활성화 시 9컷 마지막 + 캡션이 자동 정렬됨. 폰트는 카드뉴스 시각 신뢰도 + 친근감 동시 확보. |
| **Core Value** | 게시 빈도 ↑ (캡션 작성 부담 ↓), 댓글 인게이지먼트 깔때기 도입(잠재 고객 DM 채널화), 시각 정체성 강화. |

---

## Context Anchor

| Anchor | Content |
|---|---|
| **WHY** | 인스타 알고리즘은 댓글·저장·공유 비중이 높음. 현재는 "저장만" 권장이라 잠재 고객 데이터(댓글 닉네임)를 못 받음. AI가 카피·해시태그를 만들어 주면 BEN의 작업시간이 카드 작성 → 검수로 단축됨. 친근한 폰트는 "삼촌" 페르소나와 시각적 일치. |
| **WHO** | 보험삼촌 BEN (1인 운영). 인스타 팔로워 = 30대 직장인/부모/신혼부부. |
| **RISK** | (1) Gemini grounded search 비용·쿼터, (2) 폰트 라이선스 → Gmarket Sans 무료 상업 사용 OK 확인 필요, (3) Korean 자모 깨짐 (Satori/Storage 후속 단계 영향), (4) 댓글 유도 CTA가 광고 심의에 걸릴 가능성 → 가드레일 룰 사전 추가, (5) 캡션 자동 생성이 가드레일 위반어 포함 가능성. |
| **SUCCESS** | (a) "댓글 유도" CTA 선택 시 9컷 마지막 + 캡션이 댓글 유도 톤으로 자동 작성됨 (b) ✨ AI 생성 클릭 → 10초 내 캡션 + 해시태그 채워짐 (c) ZIP 다운로드 PNG가 Gmarket Sans로 렌더링 (d) 사용자가 결과를 자유롭게 편집 가능 (e) 기존 게시물 시각적 변화 X (폰트 fallback). |
| **SCOPE** | IN: CTA enum 확장, posts.reward_link 컬럼, AI 캡션·해시태그 server action + Gemini grounded search, 미리보기 페이지에 ✨ 버튼, Gmarket Sans CDN 임포트 + SlideCanvas 폰트 패밀리 분리. OUT: 폰트 무게 슬라이더 UI, 댓글 자동 답장 봇, DM 자동 발송, 해시태그 인기도 분석. |

---

## 1. Background

### 현 상태
- **CTA 옵션**: `save / share / dm / link` (4종, posts.cta_kind text)
- **캡션**: 빈 문자열로 시작, 사용자가 미리보기에서 직접 입력 (수동)
- **해시태그**: AI 생성 시 비어있음, 데모 시드만 일부 존재
- **폰트**: 슬라이드 + UI 모두 `Pretendard Variable` 단일

### 인스타 베스트 프랙티스
- "댓글로 'OO' 적어주시면 [자료] 보내드릴게요" 패턴은 도달·DM 전환 ↑ (검증된 카피라이팅 패턴)
- 캡션은 첫 80자가 핵심 (인스타 미리보기), 500자 안에 스토리 + CTA 마무리
- 해시태그 7~15개가 도달 최적점 (브랜드 + 주제 + 타겟 + 일반 혼합)
- 한국 카드뉴스 시장: Gmarket Sans / Pretendard / Gowun Dodum 3강

### 우리 프로젝트 적합성
- DB는 이미 캡션·해시태그·CTA 컬럼 보유 → 스키마 추가는 최소
- Gemini API 키 이미 사용 중 (`GEMINI_API_KEY`) → grounded search 동일 키로 호출
- SlideCanvas 단일 렌더 경로 확보 (직전 fix) → 폰트 변경 1곳만 수정

---

## 2. Requirements

### Feature 1: 댓글 유도 CTA + 추가 링크

**FR-1.1** `posts.cta_kind`가 새 enum 값 `comment_link`를 받도록 확장.
- 기존 값 `save / share / dm / link`는 유지.

**FR-1.2** `posts` 테이블에 `reward_link text` 컬럼 추가.
- 사용자가 댓글 단 사람에게 보낼 자료/링크 (예: 노션 링크, PDF URL, 짧은 안내 메모)
- nullable. CTA가 `comment_link`일 때만 의미 있음.

**FR-1.3** `/posts/new` 폼의 CTA select에 "댓글 유도" 옵션 추가.
- "댓글 유도" 선택 시 → "보낼 링크/자료" 입력 필드 동적으로 노출
- 이 필드는 미리보기 페이지에서도 다시 편집 가능

**FR-1.4** AI 스크립트 생성 시 `cta_kind=comment_link`이면 시스템 프롬프트에 추가 지시:
- "9번 슬라이드(CTA)는 댓글에 특정 키워드 적도록 유도하는 톤으로 작성"
- 예: "👇 댓글에 '체크' 적으시면 우리 가족 보험 점검 가이드 PDF 보내드려요"

**FR-1.5** AI 캡션 생성 시 `cta_kind=comment_link`이면 캡션 마지막 단락에 댓글 유도 + reward_link 안내 자동 포함.

### Feature 2: AI 캡션 + 해시태그 자동 생성

**FR-2.1** 미리보기 페이지(`/posts/[id]/preview`) 캡션 카드에 **✨ AI 자동 생성** 버튼 추가.
- 클릭 → server action 호출 → Gemini grounded search 호출 → 캡션 + 해시태그 동시 생성
- 진행 중 로딩 인디케이터 표시 (10~20초 예상)

**FR-2.2** 생성된 캡션 사양:
- 한국어, 약 400~600자 (목표 500자)
- 첫 80자에 강력한 후킹 (인스타 미리보기 잘림 대비)
- 슬라이드 9컷의 핵심 내용을 자연스러운 스토리텔링으로 재구성
- 마지막 1~2 단락에 CTA + (해당 시) 댓글 유도 + reward_link
- "삼촌" 페르소나의 친근한 반말 톤
- 가드레일 룰 자동 검사 → 위반어 사전 회피

**FR-2.3** 생성된 해시태그 사양:
- 최소 7개, 최대 15개
- 4개 카테고리(brand/topic/target/general) 자동 분류
- 브랜드 태그(`#보험삼촌`, `#unclebstudio`)는 항상 포함

**FR-2.4** 결과는 즉시 DB에 저장 (posts.caption + hashtags rows).
- 기존 PreviewBody 편집 흐름이 그대로 작동 → 사용자가 한 줄씩 수정/삭제 가능

**FR-2.5** Gemini grounded search 사용:
- `tools: [{googleSearch: {}}]` 옵션
- 검색 키워드: 게시물 주제 + 핵심 팩트 → 최신 통계/뉴스 인용 가능
- 인용 출처는 최소화 (캡션은 카피라이팅이라 출처 표기 안 함)

### Feature 3: Gmarket Sans 폰트 적용

**FR-3.1** Gmarket Sans Variable CDN을 globals.css에 추가.
- Light / Medium / Bold 3 weight 로드
- Korean 서브셋만 (성능)

**FR-3.2** SlideCanvas의 모든 텍스트(메인/보조/Q. 라벨/슬라이드 번호)에 `font-family: 'Gmarket Sans', 'Pretendard', sans-serif` 적용.
- 캐러셀 미리보기 + 폰 목업 + ZIP 1080×1080 모두 동일 적용

**FR-3.3** 관리 UI(사이드바/탑바/폼/관리자 페이지)는 **Pretendard 유지**.
- `body` font-family 변경 X — `.slide-canvas` 영역에만 적용

**FR-3.4** Korean 자모 + 영문 + 숫자 모두 정상 렌더링 (가독성 유지).

### Non-Functional

**NFR-1** AI 캡션 생성 응답 ≤ 25초 (grounded search 포함)
**NFR-2** Gemini grounded search 비용 모니터링 가능 (요청당 search 사용량 로깅)
**NFR-3** 폰트 로드 후 슬라이드 미리보기 깜빡임(FOIT/FOUT) 최소화 — `font-display: swap`
**NFR-4** 폰트 CDN 차단 환경(중국/특정 회사망)에서도 Pretendard fallback 작동
**NFR-5** 빌드 시간 +1초 이내, 번들 크기 +20KB 이내 (폰트는 외부 CDN이라 번들 영향 0)

---

## 3. Constraints

- **Gemini grounded search**: `gemini-2.5-flash` + `tools: [{googleSearch: {}}]`. 비용은 검색 1건당 약 $0.035 (텍스트 토큰 별도)
- **DB 마이그레이션**: 사용자가 SQL Editor에서 직접 실행 (3번째 0005 파일)
- **CTA enum**: posts.cta_kind는 현재 `text` 컬럼이므로 enum 변경 불필요. 클라이언트 검증만 추가.
- **Gmarket Sans 라이선스**: G마켓 공식 자유 배포 (상업 사용 OK). CDN: `https://gmarketsans.shop/` 또는 jsdelivr.
- **기존 데이터 호환**: 기존 게시물의 cta_kind = save/share/dm/link 그대로, reward_link는 null

---

## 4. Success Criteria

| ID | Criteria | Verification |
|---|---|---|
| SC-1 | `/posts/new`에서 CTA "댓글 유도" 선택 → reward_link 입력 필드 노출 + 저장 | 수동 테스트 |
| SC-2 | "댓글 유도" + reward_link 채운 상태에서 AI 스크립트 생성 → 9번 슬라이드가 댓글 유도 톤으로 작성됨 | 수동 + 로그 확인 |
| SC-3 | 미리보기에서 ✨ AI 자동 생성 클릭 → 25초 내 캡션 400~600자 + 해시태그 7개 이상 채워짐 | 수동 |
| SC-4 | 캡션이 첫 80자에 후킹 + 마지막에 CTA(+댓글 유도 시 reward_link 안내) 포함 | 수동 검수 |
| SC-5 | 해시태그가 4개 카테고리에 분산 + 브랜드 태그 자동 포함 | DB 확인 |
| SC-6 | 생성 후 사용자가 캡션·해시태그 편집/삭제 가능 (기존 흐름) | 수동 |
| SC-7 | 슬라이드 캐러셀·폰 목업·ZIP 다운로드 PNG가 Gmarket Sans로 렌더링 | 시각 확인 |
| SC-8 | 관리 UI(사이드바/탑바)는 Pretendard 유지 | 시각 확인 |
| SC-9 | 폰트 CDN 차단 시 Pretendard fallback 작동 | 네트워크 차단 테스트 |
| SC-10 | 기존 게시물의 시각적·기능적 변화 0 (cta_kind 기존값, reward_link null) | 수동 |
| SC-11 | `npm run build` 통과 | 빌드 |

---

## 5. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| Gemini grounded search 응답 지연/실패 | 사용자 대기 ↑ | 중 | 25초 타임아웃 + 실패 시 fallback (search 없이 재호출) + 명확한 에러 토스트 |
| 검색 결과의 부정확한 통계가 캡션에 들어감 | 신뢰도 ↓ | 중 | 시스템 프롬프트에 "검증되지 않은 수치는 두루뭉술하게" 명시 + 가드레일 룰로 후처리 |
| AI 캡션이 가드레일 위반어 포함 | 광고 심의 위험 | 중 | 생성 직후 evaluateGuards() 자동 검사 → 위반 시 토스트 + UI에 표시 |
| Gmarket Sans 한글 일부 글자 누락 | 시각 오류 | 낮음 | `unicode-range`로 한국어 서브셋 우선 + Pretendard fallback |
| 폰트 변경으로 기존 슬라이드 박스 외곽선 어긋남 | 레이아웃 깨짐 | 낮음 | A/B 카톡 말풍선 패딩이 폰트 metrics에 의존하지 않도록 px 고정 (이미 그렇게 됨) |
| CTA "댓글 유도"가 광고 심의 가드레일 충돌 | red flag | 낮음 | 시스템 프롬프트에 "불법 권유 X, 참여형 콘텐츠 톤" 명시 |
| reward_link이 외부 URL이라 보안 검사 필요 | 피싱/스팸 가능성 | 매우 낮음 (1인 사용) | URL 형식 검증만, 클릭 추적 X |

---

## 6. Out of Scope

- 폰트 무게(weight) 슬라이더 UI (현재 design-font-size에서 size만)
- 게시물별 폰트 패밀리 변경 (한 프로젝트 통일)
- 댓글 자동 답장 봇 (인스타 API 별도 단계)
- DM/이메일 자동 발송 (인스타 API 별도)
- 해시태그 인기도 분석/A/B 테스트
- 다국어 캡션 생성
- 캡션 초안 여러 버전 비교(A/B)
- 그라운드 서치 출처 표시 UI

---

## 7. Implementation Outline (Design 단계에서 상세화 가능)

### 7.1 DB 마이그레이션 (사용자 실행)

`studio/supabase/migrations/0005_engagement_polish.sql`
- `posts` 테이블에 `reward_link text` 컬럼 추가 (nullable)
- (선택) cta_kind에 check constraint 추가: `cta_kind in ('save','share','dm','link','comment_link')`

### 7.2 폰트 셋업

`studio/src/app/globals.css`
- Gmarket Sans @font-face 4종 (light/medium/bold) `font-display: swap`
- `.slide-canvas-font` 클래스 정의: `font-family: 'GmarketSans', 'Pretendard Variable', sans-serif`

`studio/src/components/post/SlideCanvas.tsx`
- 최상위 div에 `style={{ fontFamily: ... }}` 또는 className으로 적용

### 7.3 CTA "댓글 유도" UI + 데이터

**Feature 1.1 폼 확장**
- `studio/src/app/(chrome)/posts/new/page.tsx`:
  - CTA select에 `<option value="comment_link">댓글 유도</option>` 추가
  - `cta === 'comment_link'`일 때 `reward_link` 입력 textarea 동적 노출

**Feature 1.2 server action 확장**
- `studio/src/app/(chrome)/posts/new/actions.ts`:
  - `GeneratePostInput`에 `rewardLink?: string` 추가
  - posts insert에 `reward_link` 포함

**Feature 1.3 AI 프롬프트 동적 분기**
- `studio/src/lib/ai/gemini.ts`:
  - `buildPrompt(input)`에 `cta_mode` 처리
  - cta_kind = comment_link일 때 → 추가 지시문 prepend

**Feature 1.4 미리보기 페이지에서 reward_link 편집**
- `studio/src/app/(chrome)/posts/[id]/preview/actions.ts`:
  - 새 action `updateRewardLinkAction(postId, link)`
- PreviewBody에 reward_link 편집 카드 (cta_kind = comment_link일 때만 표시)

### 7.4 AI 캡션 + 해시태그 생성

**Gemini wrapper 확장**
- `studio/src/lib/ai/gemini.ts`:
  - 새 함수 `generateCaptionAndHashtags(input)`:
    - `tools: [{googleSearch: {}}]` 사용
    - responseSchema: `{ caption: string, hashtags: { brand: string[], topic: string[], target: string[], general: string[] } }`
  - 입력: 슬라이드 9컷 텍스트 + 주제 + 팩트 + cta_kind + reward_link

**Server action**
- `studio/src/app/(chrome)/posts/[id]/preview/actions.ts`:
  - 새 action `generateCaptionHashtagsAction(postId)`:
    1. 게시물 + 슬라이드 + reward_link fetch
    2. Gemini 호출
    3. posts.caption update
    4. 기존 hashtags 삭제 → 새 해시태그 insert
    5. revalidatePath

**UI 버튼**
- PreviewBody 캡션 카드 헤더에 ✨ AI 생성 버튼 추가
- 로딩 상태 (10~25초 진행률 또는 스피너)

### 7.5 변경 예상 파일

**신규 1**: `0005_engagement_polish.sql`

**수정 7**:
- `studio/src/app/globals.css` (Gmarket Sans @font-face)
- `studio/src/lib/supabase/types.ts` (PostRow에 reward_link)
- `studio/src/app/(chrome)/posts/new/page.tsx` (CTA select + reward_link 필드)
- `studio/src/app/(chrome)/posts/new/actions.ts` (입력에 rewardLink, prompt 분기)
- `studio/src/lib/ai/gemini.ts` (CTA 분기 + generateCaptionAndHashtags 함수)
- `studio/src/components/post/SlideCanvas.tsx` (font-family)
- `studio/src/app/(chrome)/posts/[id]/preview/actions.ts` (✨ generate action + reward_link update)
- `studio/src/components/post/PreviewBody.tsx` (✨ 버튼 + reward_link 카드)

총 9개 파일

### 7.6 변경 예상 라인
- 추가 ~400 lines
- 수정 ~80 lines
- 삭제 ~5 lines

---

## 8. Acceptance Test (수동)

### 폰트
1. 디자인 페이지 진입 → 슬라이드 미리보기·폰 목업이 Gmarket Sans 적용된 모습
2. ZIP 다운로드 → PNG 9장의 텍스트 폰트가 Gmarket Sans
3. 사이드바·탑바·관리 페이지는 Pretendard 유지 확인

### 댓글 유도 CTA
4. `/posts/new`에서 "댓글 유도" 선택 → reward_link 필드 동적 노출
5. 주제 + 팩트 + reward_link "https://notion.so/xxx" 채우고 생성
6. 9번 슬라이드 텍스트가 댓글 유도 톤 ("👇 댓글에 'OO' 적어주시면...") 확인
7. 미리보기 → reward_link 편집 가능 확인

### AI 캡션·해시태그
8. 새로 만든 게시물 미리보기 → ✨ AI 자동 생성 클릭
9. 10~25초 후 캡션 400~600자 + 해시태그 7개 이상 채워짐
10. 첫 80자 후킹 + 마지막 단락에 댓글 유도 + reward_link 언급 확인
11. 해시태그가 brand/topic/target/general 4 카테고리에 분산 확인
12. 캡션 편집 + 해시태그 삭제/추가 정상 작동

### 회귀
13. 기존 데모 게시물(p1) 진입 → 시각적·기능적 변화 0 확인
14. `npm run build` 통과

---

## 9. Open Questions

| Q | 답 |
|---|---|
| reward_link 편집 위치 (`/posts/new` 외에) | **미리보기 페이지에도** 편집 카드 (CTA = comment_link일 때만 표시) |
| AI 캡션 자동 생성 트리거 (자동 vs 버튼) | **버튼 (✨)** — 사용자 의지로 호출 (비용 절약) |
| 폰트 적용 범위 | **슬라이드 캔버스만** (관리 UI는 Pretendard 유지) |
| 검색 출처 표시 | OUT (캡션은 카피라이팅 결과물, 출처는 미공개) |
| 해시태그 최대치 | 15개 (인스타는 30개까지 허용하지만 7~15가 도달 최적) |

---

## Next: Do 단계

`/pdca do engagement-polish` 또는 `/pdca design engagement-polish` 후 do.

3개 기능이라 모듈 분리 권장:
- `module-1`: 폰트 (가장 작고 회귀 위험 낮음 — 먼저 검증)
- `module-2`: 댓글 유도 CTA (DB + 폼 + 프롬프트 분기)
- `module-3`: AI 캡션·해시태그 (Gemini grounded search)

`/pdca do engagement-polish --scope module-1` 식으로 단계별 진행 가능.
