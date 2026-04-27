# Handoff: 보험삼촌 BEN's Studio (insu insta)

> **누구한테 이걸 주는 거야?**
> Claude Code (또는 사람 개발자) 가 이 폴더만 보고 Next.js 15 + Tailwind + shadcn/ui 코드베이스를 처음부터 만들 수 있도록 준비된 패키지.

---

## 1. 이 패키지의 정체

`design_files/` 안의 HTML / JSX 파일은 **디자인 레퍼런스**입니다.
- 프로덕션 코드가 아니라, "이렇게 생기고 이렇게 동작해야 한다"를 보여주는 **HTML 프로토타입**입니다.
- React 18 + Babel-in-browser + 해시 라우터로 11개 화면을 한 페이지에 시뮬레이션해 둔 와이어프레임입니다.
- Claude Code가 해야 할 일은 **이 디자인을 실제 Next.js 15 App Router 코드베이스로 재구현**하는 것입니다. HTML을 그대로 복사하지 마세요.

## 2. Fidelity

**Mid-fidelity 와이어프레임.**
- 색·타이포·레이아웃·인터랙션은 픽셀 단위로 확정 (1.x 디자인 토큰 그대로 사용)
- 실제 AI 호출, DB, 파일 업로드, 인스타 연동은 mock — 백엔드는 별도 스펙
- 일러스트·아이콘·실제 사진은 placeholder (picsum) — 실제 자산은 추후 교체

## 3. 빠른 시작 (Claude Code 첫 프롬프트)

이 README와 `spec/insu_insta.md` 를 함께 첨부한 뒤 Claude Code에 다음과 같이 지시하세요:

````
첨부된 design_handoff_bens_studio/ 안의 README.md 와 spec/insu_insta.md 를 읽어줘.
design_files/ 의 HTML 와이어프레임은 시각 레퍼런스고, 너는 이걸 다음 환경으로 새로 만들어야 해:

- Next.js 15 (App Router, /app 디렉토리)
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Pretendard 폰트
- 다크 모드 기본 (next-themes 없이 html.dark 고정)
- 데이터는 일단 lib/mock.ts 에 넣고 서버 컴포넌트에서 import
- 인터랙션 필요한 화면만 'use client'

먼저 스펙을 읽고 폴더 구조 + 디자인 토큰 + 글로벌 레이아웃을 셋업하고,
그 다음 화면 11개를 README §6 의 우선순위 순서로 하나씩 구현해줘.
각 화면 끝낼 때마다 npm run dev 로 빌드 깨지는지 확인해.
````

## 4. 권장 폴더 구조 (Next.js 15 App Router)

```
app/
├── layout.tsx                  # html lang="ko" + dark + Pretendard + <Sidebar/><TopBar/>
├── globals.css                 # design_files/styles.css 의 :root 변수 그대로 + Tailwind layer
├── page.tsx                    # / 대시보드
├── login/page.tsx              # /login (no chrome — layout group 분리)
├── (chrome)/                   # 사이드바·탑바가 붙는 라우트 그룹
│   ├── layout.tsx
│   ├── posts/
│   │   ├── page.tsx                    # /posts 히스토리
│   │   ├── new/page.tsx                # /posts/new  (1단계)
│   │   └── [id]/
│   │       ├── page.tsx                # /posts/[id] 상세
│   │       ├── script/page.tsx         # 2단계
│   │       ├── design/page.tsx         # 3단계
│   │       └── preview/page.tsx        # 4단계
│   ├── library/page.tsx
│   └── admin/
│       ├── prompts/page.tsx
│       └── guardrails/page.tsx
components/
├── ui/                         # shadcn add 결과물
├── chrome/Sidebar.tsx
├── chrome/TopBar.tsx
├── chrome/StepIndicator.tsx
├── post/SlideCard.tsx
├── post/PrincipleBadge.tsx
├── post/GuardrailScore.tsx
├── post/GuardedText.tsx
├── post/PhoneMockup.tsx
└── post/SlidePreview.tsx
lib/
├── mock.ts                     # design_files/mock.jsx 의 데이터 그대로 TS 변환
├── principles.ts               # 6원칙 → 컬러·라벨 매핑
└── guardrails.ts               # 룰 적용 함수
```

`/login` 은 사이드바·탑바 없는 화면이므로 **루트 layout.tsx 에서는 chrome을 두지 말고**, `(chrome)/layout.tsx` 라우트 그룹에 두는 게 깔끔합니다.

## 5. 디자인 토큰 (그대로 복붙)

`app/globals.css` 의 `:root` 에 그대로:

```css
:root {
  /* 배경 */
  --bg-primary: #0A0A0A;
  --bg-secondary: #161616;
  --bg-tertiary: #232323;
  /* 텍스트 */
  --text-primary: #FFFFFF;
  --text-secondary: #B0B0B0;
  --text-muted: #6B6B6B;
  /* 브랜드 */
  --accent: #00FF88;
  --accent-hover: #00CC6A;
  --accent-bg: rgba(0,255,136,0.1);
  /* 상태 */
  --red: #FF4444;
  --yellow: #FFB800;
  --green: #00FF88;
  /* 보더 */
  --border: #2A2A2A;
  --border-focus: #00FF88;

  /* 6원칙 — 핵심! */
  --p-hook: #4DA6FF;       /* 후킹 — blue */
  --p-problem: #FF8A3D;    /* 문제점 — orange */
  --p-solution: #00FF88;   /* 해결책 — green */
  --p-doubt: #B57BFF;      /* 의심제거 — purple */
  --p-scarcity: #FF4D6D;   /* 희소성 — red */
  --p-cta: #FFD23F;        /* CTA — yellow */
}
```

타이포 (Pretendard CDN):
```
H1 32/700/1.2  · H2 24/700/1.3  · H3 18/600/1.4
Body 14/500/1.5  · Small 12/400/1.4  · Mono 13/JetBrains Mono
```

Spacing: 4·8·12·16·24·32·48 / Radius: 6·8·12·16 / Shadow: 0 4px 24px rgba(0,0,0,.4)

## 6. 화면별 구현 우선순위 & 핵심 명세

> **상세 영역 명세, 인터랙션, 인풋 종류는 `spec/insu_insta.md` §3 에 모두 정리되어 있어요. 여기서는 구현할 때 빠뜨리기 쉬운 포인트만.**

### 우선순위
1. 글로벌 layout (Sidebar + TopBar) → 모든 화면 공통
2. `/login` → 가장 단순, 라우팅 검증용
3. `/` 대시보드 → 통계 카드 + 최근 게시물 리스트
4. `/posts` 히스토리 → 그리드/리스트 토글 + 필터
5. `/posts/new` 1단계 → 폼 + 옵션 아코디언
6. `/posts/[id]/script` 2단계 ★ 가장 복잡
7. `/posts/[id]/design` 3단계 ★ 3컬럼 + 슬라이더
8. `/posts/[id]/preview` 4단계 → 캐러셀 + 폰 목업
9. `/posts/[id]` 상세 → 4단계 재사용 + 액션 버튼
10. `/library`
11. `/admin/prompts` · `/admin/guardrails`

### 6.1 글로벌 레이아웃
- Grid: `grid-template-columns: 240px 1fr` / `grid-template-rows: 56px 1fr`
- Sidebar 활성 항목 좌측에 4px accent 막대 (`::before` 절대 위치)
- TopBar 단계 인디케이터: 1️⃣→2️⃣→3️⃣→4️⃣ 형태, 현재 단계만 accent 컬러
- 자동저장 표시 "저장됨 ✓" / "저장 중..." (실제 동작은 5초 디바운스)

### 6.2 6원칙 컬러 매핑 (절대 바뀌지 않음)
```ts
// lib/principles.ts
export const PRINCIPLES = {
  hook:     { ko: '후킹',     color: 'var(--p-hook)' },
  problem:  { ko: '문제점',   color: 'var(--p-problem)' },
  solution: { ko: '해결책',   color: 'var(--p-solution)' },
  doubt:    { ko: '의심제거', color: 'var(--p-doubt)' },
  scarcity: { ko: '희소성',   color: 'var(--p-scarcity)' },
  cta:      { ko: 'CTA',      color: 'var(--p-cta)' },
} as const;
```
모든 슬라이드 카드 좌측 막대, 썸네일 닷, 배지가 이 컬러를 씀.

### 6.3 가드레일 인라인 표시
`<GuardedText>` 컴포넌트가 메인 텍스트 안의 룰 매칭 단어를:
- yellow 룰 → `text-decoration: underline wavy var(--yellow)` + 옅은 노랑 배경
- red 룰 → 동일하지만 빨강
- hover 시 추천 대체어 tooltip
- 클릭 시 자동 교체

```css
.guard-yellow {
  text-decoration: underline wavy var(--yellow);
  text-decoration-thickness: 2px;
  text-underline-offset: 4px;
  background: rgba(255,184,0,0.14);
}
.guard-red { /* 동일 패턴, --red 사용 */ }
```

### 6.4 2단계 (스크립트 편집) — 가장 큰 화면
- 2컬럼: 360px(슬라이드 리스트) / 1fr(편집 패널)
- 슬라이드 카드 = colorbar(4px) + 번호 + PrincipleBadge + 메인 텍스트 2줄 truncate + 우상단 ⚠️
- 드래그로 순서 변경 → `@dnd-kit/sortable` 권장
- "디자인 →" 클릭 시 red guardrail 1개 이상이면 **확인 다이얼로그** ("⚠️ 광고 심의 위험 X개. 진행?")

### 6.5 3단계 (이미지 합성) — 3컬럼
- 200px / 1fr / 320px
- 중앙: 1080×1080 비율 유지하며 viewport 에 맞춰 축소
- 우측 옵션 변경 → 1초 디바운스 후 자동 재렌더링 (실제로는 mock에선 즉시 반영)
- 레이아웃 템플릿 9개 중 현재 슬라이드의 6원칙에 맞는 것만 강조 (★ 마크), 나머지는 opacity 0.55

### 6.6 4단계 (미리보기) — 폰 목업 동기화
- 캐러셀 페이지 변경 ↔ 폰 목업 슬라이드 동기화 (같은 state)
- ←/→ 키보드 네비게이션 (`useEffect` + `addEventListener('keydown')`)
- 캡션 인라인 편집 (Display ↔ Textarea 토글)
- 게시 상태 RadioGroup 중 "게시 예정" 선택 시 `<input type="date">` 활성화
- ZIP 다운로드는 클라이언트 `JSZip` 또는 서버 라우트 `/api/posts/[id]/export` 둘 다 가능

### 6.7 어드민
- `/admin/prompts`: Monaco editor 권장 (없으면 `<textarea>` + `font-family: 'JetBrains Mono'`). `{topic}` 같은 변수는 컬러 하이라이트.
- `/admin/guardrails`: 테이블 + 등급/타입 필터 + 룰 추가 다이얼로그. 활성 토글은 shadcn `<Switch>`.

## 7. shadcn/ui 컴포넌트 매핑

설치할 것:
```
npx shadcn@latest add button input textarea select radio-group switch \
  card dialog sheet tabs accordion badge tooltip toast separator \
  scroll-area dropdown-menu slider checkbox
```

| 와이어프레임 클래스 | shadcn 컴포넌트 |
|---|---|
| `.btn-primary/.secondary/.ghost/.destructive` | `<Button variant="default/secondary/ghost/destructive">` |
| `.input`, `.textarea`, `.select` | `<Input>`, `<Textarea>`, `<Select>` |
| `.radio-pill` (가로 segmented) | `<RadioGroup>` 커스텀 스타일 — Tailwind plugin 으로 .data-[state=checked] 처리 |
| `.switch` | `<Switch>` |
| `.checkbox` | `<Checkbox>` |
| `.card`, `.card-pad` | `<Card>` + `<CardContent>` |
| `.overlay > .dialog` | `<Dialog>` |
| 가드레일 인라인 hover | `<Tooltip>` |
| Step 4 토스트 | `<Toaster>` + `toast()` (sonner) |
| Step 1 옵션 아코디언 | `<Accordion type="single" collapsible>` |
| Step 3 슬라이더 (흐림/오버레이) | `<Slider>` |
| 게시물 카드 hover ⋯ 메뉴 | `<DropdownMenu>` |

## 8. State 정리 (어디까지 client component 인가)

- **Server Components**: `/`, `/posts`, `/posts/[id]`, `/library`, `/admin/*` 의 데이터 fetch (mock import도 서버에서)
- **Client Components**: 4-step editor (1·2·3·4단계), 모든 폼, 가드레일 인라인 편집, 캐러셀
- 페이지 단위로 `'use client'` 박지 말고 **인터랙티브 영역만 별도 컴포넌트로 분리**해서 거기에만 박을 것

## 9. Mock 데이터

`design_files/mock.jsx` 를 그대로 `lib/mock.ts` 로 옮기되:
- `window.MOCK = {...}` 패턴 제거 → 각 상수를 `export const` 로
- `as const` 붙여서 narrow type
- React 컴포넌트에서 `import { POSTS } from '@/lib/mock'` 형태로 사용

데이터셋:
- `SCRIPT_SLIDES` — 9컷 샘플 스크립트 (가드레일 매칭 단어 포함)
- `POSTS` — 8개 게시물 (시리즈 A/B/C × 페르소나 4종 × 상태 draft/published/scheduled)
- `GUARDRAIL_RULES` — 10개 룰 (red 4 / yellow 4 / green 2)
- `PROMPT_VERSIONS` — v1/v2/v3
- `LIBRARY_PHOTOS` — 18장 (picsum)
- `HASHTAGS` — 4 카테고리

## 10. API 엔드포인트 (이번 핸드오프 범위 밖, 참고용)

스펙 §3 인터랙션에서 언급된 호출들 — 실제 구현 시 만들 라우트:
```
POST   /api/posts                     초안 생성
PATCH  /api/posts/[id]                자동저장
POST   /api/posts/[id]/generate       1→2 스크립트 생성
POST   /api/slides/[id]/regenerate    슬라이드 단독 재생성
POST   /api/posts/[id]/render         슬라이드 이미지 렌더
GET    /api/posts/[id]/export         ZIP 다운로드
GET/POST /api/admin/prompts
GET/POST/DELETE /api/admin/guardrails
```

## 11. 파일 인벤토리

`design_files/`
- `index.html` — 단일 진입점, 스크립트 6개 로드 (Babel in browser)
- `styles.css` — 모든 토큰·레이아웃·컴포넌트 CSS (700+ 라인). **여기 토큰 그대로 globals.css 에 옮기면 됨**
- `mock.jsx` — Mock 데이터 (TS로 변환 대상)
- `chrome.jsx` — Sidebar, TopBar, Layout, PrincipleBadge, SlideCard, GuardrailScore, GuardedText
- `screens-basic.jsx` — Login, Dashboard, History, PostDetail, Library
- `screens-editor.jsx` — NewPost(1), Script(2), Design(3), Preview(4)
- `screens-admin.jsx` — AdminPrompts, AdminGuardrails
- `app.jsx` — 해시 라우터 + 화면 분기

`spec/`
- `insu_insta.md` — 원본 명세서 (§1 토큰부터 §4 컴포넌트까지). **모든 영역 명세·인터랙션은 여기가 SoT**

## 12. Claude Code 작업 시 팁

1. **§5 토큰을 globals.css 에 먼저 넣고** Tailwind config 에서 `colors.bg.primary = 'var(--bg-primary)'` 식으로 노출하면 `bg-bg-primary` 같이 쓸 수 있음. 또는 그냥 임의 클래스 (`bg-[var(--bg-primary)]`).
2. **6원칙 컬러는 절대 인라인 hex 박지 말 것** — `lib/principles.ts` 에서만 단일 출처.
3. 화면 한 개 끝낼 때마다 `design_files/` 의 같은 화면을 브라우저로 열어두고 시각 비교.
4. 가드레일 매칭은 일단 단순 `String.prototype.indexOf` 로 시작 (mock.jsx 의 `GuardedText` 가 이미 그렇게 함). regex 룰은 v2에서.
5. 드래그&드롭, Monaco editor, JSZip 같은 헤비한 의존성은 일단 placeholder 로 두고 나중에 추가해도 됨.

---

**질문 생기면**: README 안에 답이 없을 때만 `spec/insu_insta.md` 를 참조하세요. 그래도 모호하면 사용자에게 확인 질문.
