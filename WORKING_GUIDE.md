# 🛠️ Claude Code 작업 지시서

> **프로젝트**: 보험삼촌 BEN's Studio (insu insta)
> **이 문서의 역할**: `README.md`가 핸드오프 패키지(무엇을 만드는지)이고, `spec/insu_insta.md`가 SoT(상세 명세)라면, 이 문서는 **너(Claude Code)가 어떤 순서로, 어떤 규칙으로, 어디까지 작업할지**를 정의하는 작업 매뉴얼이다.

---

## 0. 시작 전 필독

### 0.1 읽어야 할 파일 (이 순서대로)

1. `README.md` — 프로젝트 전체 개요, 폴더 구조, 화면 우선순위, 디자인 토큰
2. `spec/insu_insta.md` — 화면별 상세 명세 (영역·인터랙션·인풋)
3. `design_files/` 안의 HTML 와이어프레임 — 시각 레퍼런스 (직접 브라우저로 열어보기)
4. **이 파일** (`WORKING_GUIDE.md`) — 작업 진행 규칙

### 0.2 절대 하지 말 것

- ❌ `design_files/` 안의 HTML/JSX를 그대로 복사하지 말 것. 시각 레퍼런스일 뿐.
- ❌ 6원칙 컬러 hex를 컴포넌트에 인라인으로 박지 말 것. 반드시 `lib/principles.ts` 단일 출처에서.
- ❌ 모든 페이지에 `'use client'`를 박지 말 것. 인터랙티브 영역만 별도 컴포넌트로 분리해서 거기에만.
- ❌ 마일스톤을 건너뛰지 말 것. 반드시 순서대로.
- ❌ 사용자 확인 없이 새로운 라이브러리 설치하지 말 것 (shadcn 추가 컴포넌트는 OK).

### 0.3 항상 할 것

- ✅ 마일스톤 끝날 때마다 `npm run dev`로 빌드 확인, `npm run build`로 프로덕션 빌드도 확인.
- ✅ 화면 한 개 끝낼 때마다 `design_files/`의 같은 화면을 브라우저로 열어두고 시각 비교.
- ✅ 모르겠으면 사용자에게 질문. 추측하지 말 것.
- ✅ 각 마일스톤 끝에 진행 상황을 한 줄로 보고 (예: "M2 완료. dashboard 동작 확인. 다음은 M3 히스토리").

---

## 1. 개발 환경 셋업 (M0)

### 1.1 사전 요구사항 확인

```bash
node --version    # v20 이상
npm --version     # v10 이상
git --version
```

### 1.2 프로젝트 초기화

```bash
# Next.js 15 프로젝트 생성 (App Router, TypeScript, Tailwind, ESLint, src 디렉토리 사용 안함)
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --turbopack

# shadcn/ui 초기화 (기본값으로)
npx shadcn@latest init -d

# README §7 의 컴포넌트 모두 설치
npx shadcn@latest add button input textarea select radio-group switch \
  card dialog sheet tabs accordion badge tooltip sonner separator \
  scroll-area dropdown-menu slider checkbox

# 추가 패키지
npm install @dnd-kit/core @dnd-kit/sortable lucide-react clsx
npm install -D @types/node
```

### 1.3 Pretendard 폰트 설정

`app/layout.tsx`의 `<head>`에 CDN 추가:
```html
<link rel="stylesheet" type="text/css"
  href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
```

`tailwind.config.ts`에서 `font-sans`를 Pretendard로:
```ts
fontFamily: {
  sans: ['Pretendard Variable', 'Pretendard', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'monospace'],
}
```

### 1.4 다크 모드 고정

`app/layout.tsx`:
```tsx
<html lang="ko" className="dark">
```
`next-themes`는 사용하지 않음 (사용자가 다크 모드만 쓴다고 명시함).

### 1.5 디자인 토큰 주입

`app/globals.css`의 최상단에 `README.md §5`의 `:root` 변수 그대로 복붙. 그 아래에 Tailwind layer.

`tailwind.config.ts`에서 토큰 노출:
```ts
colors: {
  bg: {
    primary: 'var(--bg-primary)',
    secondary: 'var(--bg-secondary)',
    tertiary: 'var(--bg-tertiary)',
  },
  fg: {
    primary: 'var(--text-primary)',
    secondary: 'var(--text-secondary)',
    muted: 'var(--text-muted)',
  },
  accent: {
    DEFAULT: 'var(--accent)',
    hover: 'var(--accent-hover)',
    bg: 'var(--accent-bg)',
  },
  border: 'var(--border)',
  state: {
    red: 'var(--red)',
    yellow: 'var(--yellow)',
    green: 'var(--green)',
  },
  // 6원칙 컬러는 Tailwind 토큰으로 노출하지 말 것 (lib/principles.ts에서만 사용)
}
```

### 1.6 검증
- [ ] `npm run dev` → http://localhost:3000 에서 기본 Next.js 페이지 보임
- [ ] 다크 배경 (#0A0A0A) 적용 확인
- [ ] Pretendard 폰트 적용 확인 (개발자 도구로)
- [ ] `npm run build` 통과
- [ ] Git 초기 커밋: `chore: initial setup with next15 + tailwind + shadcn`

**M0 완료 후 한 줄 보고.**

---

## 2. 글로벌 인프라 (M1)

### 2.1 폴더 구조 생성

`README.md §4`의 폴더 구조를 그대로 만든다. 빈 파일이라도 OK (placeholder).

```
app/
├── layout.tsx              (글로벌, html lang=ko + dark + 폰트)
├── globals.css             (토큰 + tailwind)
├── page.tsx                (대시보드 - placeholder)
├── login/page.tsx          (placeholder)
└── (chrome)/
    ├── layout.tsx          (Sidebar + TopBar 래핑)
    ├── posts/
    │   ├── page.tsx
    │   ├── new/page.tsx
    │   └── [id]/
    │       ├── page.tsx
    │       ├── script/page.tsx
    │       ├── design/page.tsx
    │       └── preview/page.tsx
    ├── library/page.tsx
    └── admin/
        ├── prompts/page.tsx
        └── guardrails/page.tsx
components/
├── ui/                     (shadcn 결과물)
├── chrome/
│   ├── Sidebar.tsx
│   ├── TopBar.tsx
│   └── StepIndicator.tsx
└── post/
    ├── SlideCard.tsx
    ├── PrincipleBadge.tsx
    ├── GuardrailScore.tsx
    ├── GuardedText.tsx
    ├── PhoneMockup.tsx
    └── SlidePreview.tsx
lib/
├── mock.ts
├── principles.ts
├── guardrails.ts
└── utils.ts                (cn 함수 등 — shadcn이 만들어줌)
```

### 2.2 핵심 lib 파일 작성

**`lib/principles.ts`** (단일 출처):
```ts
export const PRINCIPLES = {
  hook:     { ko: '후킹',     color: 'var(--p-hook)' },
  problem:  { ko: '문제점',   color: 'var(--p-problem)' },
  solution: { ko: '해결책',   color: 'var(--p-solution)' },
  doubt:    { ko: '의심제거', color: 'var(--p-doubt)' },
  scarcity: { ko: '희소성',   color: 'var(--p-scarcity)' },
  cta:      { ko: 'CTA',      color: 'var(--p-cta)' },
} as const;

export type PrincipleKey = keyof typeof PRINCIPLES;
```

**`lib/mock.ts`**: `design_files/mock.jsx`의 모든 데이터를 TypeScript로 변환.
- `window.MOCK = {...}` 패턴 제거
- 각 상수를 `export const`로
- 타입 정의 (`Post`, `Slide`, `GuardrailRule`, `PromptVersion`, `LibraryPhoto`, `Hashtag`)
- `as const` 활용

**`lib/guardrails.ts`**: 단순 문자열 매칭으로 시작.
```ts
export function checkGuardrail(text: string, rules: GuardrailRule[]): GuardrailMatch[] { ... }
```
regex는 v2.

### 2.3 글로벌 레이아웃 (`(chrome)/layout.tsx`)

`README.md §6.1`의 그리드:
- `grid-template-columns: 240px 1fr`
- `grid-template-rows: 56px 1fr`
- TopBar (전체 너비)
- Sidebar (좌측 240px)
- Main (우측 1fr)

### 2.4 Chrome 컴포넌트 작성

**`Sidebar.tsx`** (Server Component):
- `lib/mock.ts`에서 메뉴 항목 import
- 활성 항목은 좌측에 4px accent 막대 (`::before` 절대 위치)
- 현재 경로는 `usePathname()`이 필요하므로 별도 `'use client'` 컴포넌트로 분리 (`SidebarItem.tsx`)

**`TopBar.tsx`**:
- 좌측 로고 + 우측 사용자 아바타는 Server
- 중앙 단계 인디케이터는 `'use client'` (현재 경로 기반)

**`StepIndicator.tsx`** (Client):
- props: `currentStep: 1 | 2 | 3 | 4`
- 각 단계 아이콘 + 텍스트, 현재 단계만 accent 컬러

### 2.5 검증
- [ ] 모든 폴더·파일 생성됨 (placeholder OK)
- [ ] `(chrome)/` 라우트의 모든 페이지에 사이드바·탑바 보임
- [ ] `/login`은 사이드바·탑바 없이 빈 페이지
- [ ] 사이드바 메뉴 클릭 시 라우팅 작동
- [ ] `npm run build` 통과
- [ ] Git 커밋: `feat(m1): global layout + chrome components + lib setup`

**M1 완료 후 한 줄 보고.**

---

## 3. 화면 구현 마일스톤

각 마일스톤은 **README §6의 우선순위 순서**를 따른다. 한 화면 끝내면 반드시:
1. `npm run dev`로 화면 동작 확인
2. `design_files/` 같은 화면과 시각 비교
3. `npm run build` 통과 확인
4. Git 커밋
5. 한 줄 보고 후 다음으로

---

### M2: `/login` (가장 단순, 라우팅 검증용)

**참조**: `spec §3.1`

**구현 포인트**:
- 중앙 정렬 카드 (width 400px)
- 이메일 + 비밀번호 + 로그인 버튼
- 로그인 클릭 시 mock으로 `/`로 라우팅 (`router.push('/')`)
- `'use client'` (form 인터랙션)

**검증**: 로그인 → 대시보드로 이동되는지

---

### M3: `/` 대시보드

**참조**: `spec §3.2`

**구현 포인트**:
- 인사말 + 퀵 시작 카드 (주제 입력 → `/posts/new?topic=...`로 이동)
- 통계 카드 4개 (mock 데이터)
- 최근 게시물 5개 리스트 (`POSTS` mock에서 slice)
- 페이지 자체는 Server Component, 퀵 시작 입력만 `'use client'` 분리

**검증**: 퀵 시작 카드에서 주제 입력 후 생성 → `/posts/new`로 query 파라미터 전달되는지

---

### M4: `/posts` 히스토리

**참조**: `spec §3.7`

**구현 포인트**:
- 검색 input + 시리즈/페르소나/상태 Select 필터
- 그리드/리스트 뷰 토글
- 카드 hover 시 위로 4px + 그림자
- 카드 hover 시 우상단 ⋯ 메뉴 (DropdownMenu)
- 페이지네이션 (mock 데이터라 8개니까 일단 페이지네이션 UI만)
- 필터 인터랙션은 `'use client'` 컴포넌트로 분리

**검증**: 시리즈 필터 변경 시 카드 목록이 바뀌는지

---

### M5: `/posts/new` (1단계 입력)

**참조**: `spec §3.3`

**구현 포인트**:
- 폼 필드 10개 (필수 6 + 옵션 4)
- 옵션 필드는 Accordion으로 접기
- 톤 강도는 RadioGroup
- "안 파는 설계사"는 Switch
- 자동저장 표시는 mock (실제 API 호출 X, useState로 5초 setTimeout)
- "스크립트 생성" 클릭 시 mock으로 `/posts/sample-001/script`로 이동
- 페이지 전체가 `'use client'` (폼 상태 때문)

**검증**:
- 필수 필드 미입력 시 버튼 비활성화
- 옵션 아코디언 펼치기/접기
- 자동저장 표시 동작 ("저장 중..." → "저장됨 ✓")

---

### M6: `/posts/[id]/script` (2단계 — ⭐ 가장 복잡)

**참조**: `spec §3.4`, `README §6.4`

**구현 포인트**:

#### 6-1. 레이아웃
- 2컬럼: `grid-template-columns: 360px 1fr`
- 상단에 GuardrailScore 카드 (전체 너비)

#### 6-2. 슬라이드 리스트 (좌측)
- 9개 카드 세로 배치, scroll-area
- 각 카드: 좌측 4px 컬러 막대 (6원칙 컬러) + 번호 + PrincipleBadge + 메인 텍스트 2줄 truncate + 우상단 ⚠️ (가드레일 경고 있을 시)
- 선택된 카드는 두꺼운 accent 보더 + 배경 변화
- 드래그 핸들 (좌측 점 6개) — `@dnd-kit/sortable` 사용
- "+ 슬라이드 추가" 버튼 (하단)

#### 6-3. 편집 패널 (우측)
- 6원칙 라벨 Select (변경 가능)
- 화자 RadioGroup (조카 / 삼촌 / 없음)
- 장면 묘사 Textarea
- 메인 텍스트 Textarea — **여기에 GuardedText 적용** (다음 항목 참조)
- 보조 텍스트 Textarea
- 강조 표현 태그 입력 (각 태그 X 버튼, [+] 추가)
- 가드레일 경고 패널 (옐로우/레드 매칭 단어 리스트)
- "🔄 이 슬라이드만 재생성" 버튼 (mock)

#### 6-4. GuardedText 컴포넌트
**파일**: `components/post/GuardedText.tsx`

```tsx
'use client';
// props: text, rules
// 매칭된 단어를 <span class="guard-yellow|guard-red">로 감싸서 렌더
// hover 시 Tooltip으로 추천 대체어 표시
// 클릭 시 onReplace(matchedText, suggestedReplacement) 호출
```

CSS는 `globals.css`에:
```css
.guard-yellow {
  text-decoration: underline wavy var(--yellow);
  text-decoration-thickness: 2px;
  text-underline-offset: 4px;
  background: rgba(255,184,0,0.14);
  cursor: pointer;
}
.guard-red {
  text-decoration: underline wavy var(--red);
  text-decoration-thickness: 2px;
  text-underline-offset: 4px;
  background: rgba(255,68,68,0.14);
  cursor: pointer;
}
```

**중요**: Textarea 위에 오버레이로 띄우는 게 까다로우니, **편집 모드와 읽기 모드를 토글**하는 방식 권장. 클릭 시 편집 가능, blur 시 읽기 모드(=하이라이트 표시).

#### 6-5. "디자인 →" 버튼
- 클릭 시 red 가드레일이 1개 이상이면 Dialog로 확인 ("⚠️ 광고 심의 위험 X개. 진행?")
- 확인 시 `/posts/[id]/design`로 이동

**검증**:
- 슬라이드 카드 클릭 → 우측 편집 패널 갱신
- 메인 텍스트 안의 "가입" 단어가 옐로우 하이라이트됨
- "삼성생명" 단어가 레드 하이라이트됨
- 하이라이트 단어 hover 시 tooltip 표시
- 드래그로 슬라이드 순서 변경 가능
- 라벨 Select 변경 시 좌측 카드의 컬러 막대도 변경

---

### M7: `/posts/[id]/design` (3단계)

**참조**: `spec §3.5`, `README §6.5`

**구현 포인트**:
- 3컬럼: `grid-template-columns: 200px 1fr 320px`
- 중앙 미리보기는 1080×1080 비율 (화면 안에 맞게 축소). aspect-ratio: 1
- 우측 옵션:
  - 레이아웃 템플릿 3×3 그리드 (현재 슬라이드 6원칙에 맞는 것 ★ 마크, 나머지 opacity 0.55)
  - 배경 사진 3 버튼 (모달 placeholder) — Sheet 컴포넌트로 라이브러리 그리드만 표시
  - 흐림 강도 Slider (0~20px)
  - 어두운 오버레이 Slider (0~80%)
  - "전체 슬라이드 적용" Switch
  - 텍스트 위치 RadioGroup (상/중/하)
  - 강조 컬러 RadioGroup (4색)
- 옵션 변경 시 1초 디바운스 후 자동 재렌더링 (mock에서는 즉시 반영)

**검증**:
- 좌측 슬라이드 클릭 → 중앙·우측 갱신
- 슬라이더 조절 시 중앙 미리보기 변화 (배경 흐림 정도 등 mock)
- 배경 사진 버튼 클릭 → Sheet 열림

---

### M8: `/posts/[id]/preview` (4단계)

**참조**: `spec §3.6`, `README §6.6`

**구현 포인트**:
- 상단 2컬럼: 캐러셀 1fr / 폰 목업 320px
- 캐러셀:
  - 좌우 화살표 + 점 9개
  - 키보드 ←/→ (`useEffect` + addEventListener)
  - 캐러셀 페이지 변경 ↔ 폰 목업 동기화 (같은 state)
- 폰 목업:
  - iPhone 프레임 SVG 또는 둥근 사각형
  - 인스타 피드 시뮬레이션 (헤더, 이미지, 액션 버튼, 캡션)
- 캡션 카드: 인라인 편집 (Display ↔ Textarea 토글)
- 해시태그: 4 카테고리, 각 태그 X 버튼, [+] 추가
- 게시 상태 RadioGroup ("게시 예정" 선택 시 `<input type="date">` 활성화)
- 다운로드 버튼: 클릭 시 sonner toast로 "다운로드 완료" (실제 ZIP 생성은 v2)

**검증**:
- 화살표 클릭 시 캐러셀 + 폰 목업 같이 이동
- 키보드 ←/→ 동작
- 캡션 인라인 편집 동작
- "게시 예정" 선택 시 날짜 input 나타남

---

### M9: `/posts/[id]` 게시물 상세

**참조**: `spec §3.8`

**구현 포인트**:
- 4단계 화면을 `<PreviewLayout>` 컴포넌트로 추출해서 재사용
- 상단에 액션 버튼 추가: [편집 ✏️] [복제 📋] [삭제 🗑️]
- 편집 → `/posts/[id]/script`
- 복제 → mock으로 새 ID 생성하고 `/posts/new`로 이동 (query로 데이터 전달)
- 삭제 → Dialog 확인 후 mock 삭제 + `/posts`로 이동

---

### M10: `/library`

**참조**: `spec §3.9`

**구현 포인트**:
- Tabs: "배경 사진" / "템플릿"
- 배경 사진 그리드: 6 columns, picsum 이미지
- "+ 업로드" 버튼 (mock, 파일 선택 다이얼로그만)
- "🔍 Unsplash 검색" 버튼 (mock, Sheet 열고 검색 input + 결과 그리드)
- 사진 hover 시 우상단에 사용 횟수, 다운로드, 삭제 메뉴

---

### M11: `/admin/prompts`

**참조**: `spec §3.10`

**구현 포인트**:
- 카테고리 Select (스크립트 생성 / 슬라이드 재생성 / 캡션 / 해시태그)
- 활성 프롬프트 표시 (Textarea + monospace 폰트)
  - Monaco editor는 v2. 일단 Textarea + `font-family: var(--font-mono)`
  - `{topic}` 같은 변수는 단순 hex highlight (CSS로 처리하지 말고, 일단 plain textarea)
- [💾 저장] [🔄 이전 버전 보기] [✕ 비활성화] 버튼
- 하단에 버전 히스토리 리스트

---

### M12: `/admin/guardrails`

**참조**: `spec §3.11`

**구현 포인트**:
- 등급/타입 필터 Select
- 룰 테이블 (등급 배지 / 타입 / 패턴 / 활성 Switch / 메시지 / 액션)
- 우상단 [+ 룰 추가] → Dialog (등급 RadioGroup / 타입 Select / 패턴 Input / 메시지 Input / 추천 대체어 Input)
- 활성 토글은 Switch

---

## 4. 작업 진행 규칙

### 4.1 마일스톤 진행 방식
- 한 번에 한 마일스톤만. 절대 동시에 여러 화면 시작하지 말 것.
- 마일스톤 시작 시 사용자에게 "M{N} 시작합니다. {화면명} 구현하겠습니다." 한 줄 보고.
- 마일스톤 끝나면 빌드 확인 + 커밋 + "M{N} 완료. 다음은 M{N+1}." 보고.

### 4.2 Git 커밋 메시지 컨벤션
```
feat(m{N}): 화면 또는 기능 한 줄 요약
fix(m{N}): 버그 수정 한 줄 요약
chore: 인프라·설정 변경
refactor: 리팩토링
```

### 4.3 모르겠을 때
1. 먼저 `README.md`에 답이 있는지 확인
2. 없으면 `spec/insu_insta.md`에서 확인
3. 그래도 모호하면 **사용자에게 질문** (추측 금지)

질문할 때 형식:
```
❓ M{N} 진행 중 막힌 부분:
- 무엇을 만들고 있는지: ...
- 막힌 이유: ...
- 옵션 A: ...
- 옵션 B: ...
- 추천: ...
```

### 4.4 의존성 추가 정책
- shadcn 컴포넌트는 자유롭게 추가 OK
- npm 패키지는 사용자 확인 받고 추가
- 이미 명세된 것 (`@dnd-kit`, `lucide-react`, `clsx`)은 OK

### 4.5 코드 스타일
- 컴포넌트는 `function ComponentName()` 선언 (arrow function 금지)
- props 타입은 `interface` 사용
- 'use client' 디렉티브는 파일 최상단
- import 순서: React → Next.js → 외부 라이브러리 → @/ 절대경로 → 상대경로

---

## 5. 완료 기준 (Definition of Done)

각 마일스톤은 다음을 모두 만족해야 완료:

- [ ] 화면이 디자인 명세대로 보임 (`design_files/` 시각 비교)
- [ ] 명세된 인터랙션 동작
- [ ] `npm run build` 통과 (TypeScript 에러 0)
- [ ] `npm run dev` 핫 리로드 정상
- [ ] 콘솔 에러·경고 0 (또는 의식적으로 무시한 것만 명시)
- [ ] Git 커밋 완료
- [ ] 사용자에게 한 줄 보고

---

## 6. v1 범위 밖 (절대 손대지 말 것)

다음은 명세에 언급되어도 **이번 핸드오프 범위 밖**:

- 실제 AI API 호출 (Anthropic API)
- 실제 DB 연동 (Supabase)
- 실제 인증 (Supabase Auth)
- 실제 이미지 렌더링 (Satori)
- 실제 파일 업로드 / Storage
- ZIP 다운로드 실제 생성 (toast만 표시)
- Unsplash API 실제 호출
- Monaco editor (Textarea로 대체)
- 실제 자동저장 (mock setTimeout만)

이것들은 별도 백엔드 마일스톤 (M13~)에서 처리. 사용자가 요청하기 전까지 시작하지 말 것.

---

## 7. 최종 인계

M2~M12 완료 후 사용자에게:

```
✅ Phase 1 (UI Mock) 완료. 11개 화면 모두 구현.

다음 단계 옵션:
A) 사용자가 직접 클릭해보며 UX 검증
B) 백엔드 연동 시작 (M13~: Supabase + Anthropic API)
C) 디자인 폴리싱 (애니메이션, 마이크로 인터랙션)

어느 방향으로 갈지 알려주세요.
```

---

## 8. 부록: 트러블슈팅

### 8.1 Tailwind v4 + shadcn 호환성
shadcn은 Tailwind v3 기준으로 설정됨. v4 사용 시 PostCSS 설정 등 충돌 가능. 문제 발생 시:
- `tailwind.config.ts` 대신 `tailwind.config.js`
- shadcn `init` 시 v3 모드 옵션 확인
- 정 안되면 사용자에게 "v3로 다운그레이드 vs v4 유지" 질문

### 8.2 한글 폰트 깨짐
Pretendard CDN이 차단된 환경이면 next/font로 변경:
```ts
import { Pretendard } from 'next/font/google';  // 안 될 가능성 높음
// 대안: 로컬 폰트 파일 다운로드해서 public/fonts/에 넣고 next/font/local 사용
```

### 8.3 다크 모드 컬러 안 먹힘
`html.dark` 고정인데 Tailwind가 적용 안 되면 `tailwind.config.ts`에:
```ts
darkMode: 'class',
```

---

**끝. 이 문서를 다 읽었으면 사용자에게 "WORKING_GUIDE.md 다 읽었습니다. M0부터 시작해도 될까요?" 라고 확인 후 시작.**
