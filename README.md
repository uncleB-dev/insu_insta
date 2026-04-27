# 보험삼촌 BEN's Studio (insu_insta)

인스타 카드뉴스 6원칙 기반 스크립트 생성 + 가드레일 + 디자인 + 미리보기 워크플로우 UI.

## 폴더

```
insu_insta/
├── studio/                       # ← Next.js 15 앱 (Vercel 배포 루트)
├── design_handoff_bens_studio/   # 디자인 핸드오프 패키지 (와이어프레임 + 토큰)
├── spec/                         # 상세 명세 (insu_insta.md)
└── WORKING_GUIDE.md              # Claude Code 작업 매뉴얼
```

## 스택

- Next.js 15 (App Router, Turbopack)
- TypeScript / Tailwind CSS v4 / shadcn/ui
- 다크 모드 고정, Pretendard + JetBrains Mono

## 로컬 실행

```bash
cd studio
npm install
npm run dev
```

http://localhost:3000

## 빌드

```bash
cd studio
npm run build
```

## Vercel 배포 설정

Import 시 다음 옵션을 지정해주세요:

| 항목 | 값 |
|---|---|
| **Root Directory** | `studio` |
| Framework Preset | Next.js |
| Build Command | `next build` (자동) |
| Output Directory | `.next` (자동) |
| Install Command | `npm install` (자동) |

## 구현된 화면 (M0~M12)

| Route | 화면 |
|---|---|
| `/login` | 로그인 |
| `/` | 대시보드 |
| `/posts` | 히스토리 |
| `/posts/new` | 1단계 — 주제 입력 |
| `/posts/[id]/script` | 2단계 — 스크립트 편집 |
| `/posts/[id]/design` | 3단계 — 이미지 합성 |
| `/posts/[id]/preview` | 4단계 — 미리보기 & 다운로드 |
| `/posts/[id]` | 게시물 상세 |
| `/library` | 라이브러리 |
| `/admin/prompts` | 프롬프트 관리 |
| `/admin/guardrails` | 가드레일 관리 |

## 현재 상태

Phase 1 (UI Mock) 완료. 11개 화면 모두 구현, `npm run build` 통과.

일부 인터랙션은 mock(toast)으로만 동작합니다 (드래그 정렬, 자동 교체, 자동 저장 표시 등). 자세한 누락 항목은 개별 PR/이슈로 추적 예정.

## 다음 단계

- [ ] 인터랙션 보완 (drag-and-drop, tooltip, 자동저장 시뮬레이션)
- [ ] M13~ 백엔드 연동 (Supabase + Anthropic API)
- [ ] 디자인 폴리싱
