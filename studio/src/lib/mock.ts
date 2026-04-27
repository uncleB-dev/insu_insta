import type { PrincipleKey } from './principles';

export type Series = 'A' | 'B' | 'C';
export type PersonaKey = '30s_office' | 'newbie' | 'parent' | 'newlywed';
export type PostStatus = 'draft' | 'published' | 'scheduled';
export type SpeakerKey = 'niece' | 'uncle' | 'none';
export type GuardKind = 'red' | 'yellow' | 'green';
export type RuleKind = 'word' | 'regex';

export type GuardHitRaw = { word: string; kind: GuardKind; suggest: string };

export type Slide = {
  id: string;
  principle: PrincipleKey;
  speaker: SpeakerKey;
  scene: string;
  main: string;
  sub: string;
  emphasis: string[];
  guards: GuardHitRaw[];
};

export type Post = {
  id: string;
  title: string;
  series: Series;
  persona: PersonaKey;
  status: PostStatus;
  updated: string;
  slides: number;
  hook: string;
};

export type GuardrailRule = {
  id: string;
  level: GuardKind;
  kind: RuleKind;
  pattern: string;
  message: string;
  replace: string;
  active: boolean;
};

export type PromptVersion = {
  v: string;
  active: boolean;
  date: string;
  author: string;
};

export type LibraryPhoto = {
  id: string;
  src: string;
  uses: number;
  source: 'upload' | 'unsplash' | 'library';
};

export type HashtagMap = {
  brand: string[];
  topic: string[];
  target: string[];
  general: string[];
};

// ─── 시리즈 ────────────────────────────────
export const SERIES: Record<Series, string> = {
  A: '시리즈 A · 잘못된 보험 정리',
  B: '시리즈 B · 가족 보험 정리',
  C: '시리즈 C · 생애 이벤트',
};

// ─── 페르소나 ──────────────────────────────
export const PERSONAS: Record<PersonaKey, string> = {
  '30s_office': '30대 직장인',
  'newbie':     '사회 초년생',
  'parent':     '부모 세대',
  'newlywed':   '신혼 부부',
};

// ─── 9컷 샘플 스크립트 ─────────────────────
export const SCRIPT_SLIDES: Slide[] = [
  {
    id: 's1', principle: 'hook', speaker: 'none',
    scene: '카톡 알림 일러스트, 어두운 배경에 메시지 한 줄이 떠오른다',
    main: '하루 입원비 20만원, 진짜 그런 보험 있냐고?',
    sub: '오빠 친구가 휴직하고 엄마 간병하는데 매일 그렇게 쓴대.',
    emphasis: ['20만원'], guards: [],
  },
  {
    id: 's2', principle: 'hook', speaker: 'niece',
    scene: '카톡 말풍선 두 개가 화면 가운데에 떠 있음',
    main: '삼촌!! 카톡 받았는데 이거 진짜야?',
    sub: '엄마가 너무 걱정돼서 보냈어',
    emphasis: ['진짜야'], guards: [],
  },
  {
    id: 's3', principle: 'problem', speaker: 'uncle',
    scene: '삼촌이 진지한 얼굴로 노트북 화면을 가리킴',
    main: '치료비 1회에 수백만 원, 연 1억 넘는 케이스도 있어',
    sub: '요즘 항암치료가 비급여 위주로 가는데 그게 다 본인 부담이거든',
    emphasis: ['수백만 원', '1억'],
    guards: [{ word: '가입', kind: 'yellow', suggest: '준비' }],
  },
  {
    id: 's4', principle: 'problem', speaker: 'niece',
    scene: '조카가 놀란 표정의 이모티콘과 함께',
    main: '헐... 그게 다 자기 돈이라고?',
    sub: '실손으로 다 되는 거 아니었어?',
    emphasis: ['자기 돈'], guards: [],
  },
  {
    id: 's5', principle: 'solution', speaker: 'uncle',
    scene: '구조도 일러스트: 비급여통합 + 진단비 박스',
    main: '비급여통합 + 진단비, 이 두 개가 핵심이야',
    sub: '어떤 회사든 이 두 가지 구조만 갖추면 큰 그림은 같아',
    emphasis: ['비급여통합', '진단비'], guards: [],
  },
  {
    id: 's6', principle: 'doubt', speaker: 'niece',
    scene: '조카가 갸우뚱하는 모습',
    main: '근데 그거 비싸지 않아?',
    sub: '한 달에 몇만원 더 내야 한다며',
    emphasis: ['비싸지 않아'], guards: [],
  },
  {
    id: 's7', principle: 'doubt', speaker: 'uncle',
    scene: '삼촌이 차분하게 도표를 보여줌',
    main: '오히려 반대야. 안 들면 한 번에 몇천만 원이 나가',
    sub: '월 단위로는 작아 보여도 평생 보면 몇 배 차이가 나',
    emphasis: ['몇천만 원'],
    guards: [{ word: '월 5만 원', kind: 'red', suggest: '일정 금액' }],
  },
  {
    id: 's8', principle: 'scarcity', speaker: 'uncle',
    scene: '병원 입구 일러스트, 흐릿한 배경',
    main: '건강할 때만 가입할 수 있다는 게 진짜 함정이야',
    sub: '진단 받고 나면 그땐 어떤 회사도 안 받아줘',
    emphasis: ['건강할 때만'],
    guards: [{ word: '가입', kind: 'yellow', suggest: '준비' }],
  },
  {
    id: 's9', principle: 'cta', speaker: 'uncle',
    scene: '저장 아이콘과 공유 아이콘이 강조된 마지막 컷',
    main: '우리 엄마 보험, 한 번 점검해볼래?',
    sub: '저장하고 부모님께도 공유해줘',
    emphasis: ['한 번 점검'], guards: [],
  },
];

// ─── 게시물 목록 ───────────────────────────
export const POSTS: Post[] = [
  { id: 'p1', title: '암치료비가 비싸다는데 얼마나?',       series: 'A', persona: '30s_office', status: 'published', updated: '2일 전',  slides: 9, hook: '하루 입원비 20만원...' },
  { id: 'p2', title: '1세대 실손 해지하면 진짜 후회한다는 이유', series: 'B', persona: 'parent',     status: 'draft',     updated: '5일 전',  slides: 9, hook: '엄마 1세대 실손...' },
  { id: 'p3', title: '이직할 때 보험 어떻게 옮겨야 해?',   series: 'C', persona: 'newbie',     status: 'published', updated: '1주 전',  slides: 7, hook: '회사 단체보험 끝나면...' },
  { id: 'p4', title: '신혼 부부 보험 처음부터 다시 짜기',   series: 'C', persona: 'newlywed',  status: 'scheduled', updated: '2주 전',  slides: 9, hook: '결혼하면 보험도 합쳐...' },
  { id: 'p5', title: '비급여, 도대체 뭐가 비급여인지',      series: 'A', persona: '30s_office', status: 'draft',     updated: '3주 전',  slides: 9, hook: 'MRI 한 번에 80만원...' },
  { id: 'p6', title: '간병보험 vs 간병인지원금 뭐가 다른데?', series: 'B', persona: 'parent',     status: 'published', updated: '1달 전',  slides: 9, hook: '간병보험이라고 해서...' },
  { id: 'p7', title: '치아보험, 진짜 들어야 하는 사람은 누구', series: 'A', persona: '30s_office', status: 'published', updated: '1달 전',  slides: 7, hook: '임플란트 한 개 200만원...' },
  { id: 'p8', title: '운전자보험 1만원짜리, 진짜 충분할까?', series: 'A', persona: '30s_office', status: 'draft',     updated: '5주 전',  slides: 9, hook: '한 달에 만 원이면...' },
];

// ─── 해시태그 ──────────────────────────────
export const HASHTAGS: HashtagMap = {
  brand:   ['보험삼촌', '보험삼촌BEN', 'unclebstudio'],
  topic:   ['암보험', '비급여', '간병보험', '실손보험'],
  target:  ['30대보험', '엄마보험', '직장인보험'],
  general: ['보험상식', '재테크', '금융지식'],
};

// ─── 가드레일 룰 ──────────────────────────
export const GUARDRAIL_RULES: GuardrailRule[] = [
  { id: 'g1',  level: 'red',    kind: 'word',  pattern: '삼성생명',           message: '특정사 비방 금지',           replace: '특정 회사',   active: true },
  { id: 'g2',  level: 'red',    kind: 'word',  pattern: '한화생명',           message: '특정사 비방 금지',           replace: '특정 회사',   active: true },
  { id: 'g3',  level: 'red',    kind: 'regex', pattern: '월\\s*\\d+\\s*만\\s*원', message: '구체 보험료 명시 금지(광고 심의)', replace: '일정 금액',   active: true },
  { id: 'g4',  level: 'red',    kind: 'regex', pattern: '\\d+\\s*세\\s*가입', message: '연령 + 가입 직접 명시 금지', replace: '연령대 준비', active: true },
  { id: 'g5',  level: 'yellow', kind: 'word',  pattern: '가입',               message: '권유 표현 약화',             replace: '준비',        active: true },
  { id: 'g6',  level: 'yellow', kind: 'word',  pattern: '상담',               message: '권유 표현 약화',             replace: '분석',        active: true },
  { id: 'g7',  level: 'yellow', kind: 'word',  pattern: '추천',               message: '권유 표현 약화',             replace: '소개',        active: true },
  { id: 'g8',  level: 'yellow', kind: 'word',  pattern: '무조건',             message: '단정 표현 약화',             replace: '대체로',      active: true },
  { id: 'g9',  level: 'green',  kind: 'word',  pattern: '정보',               message: '안전 표현',                  replace: '',            active: true },
  { id: 'g10', level: 'green',  kind: 'word',  pattern: '점검',               message: '안전 표현',                  replace: '',            active: true },
];

// ─── 프롬프트 버전 ─────────────────────────
export const PROMPT_VERSIONS: PromptVersion[] = [
  { v: 'v3', active: true,  date: '2026-04-25', author: 'BEN' },
  { v: 'v2', active: false, date: '2026-04-10', author: 'BEN' },
  { v: 'v1', active: false, date: '2026-04-01', author: 'BEN' },
];

export const PROMPT_BODY = `당신은 한국 보험설계사 "보험삼촌 BEN"의 인스타그램 카드뉴스
스크립트를 작성하는 전문 카피라이터입니다.

# 입력
- 주제: {topic}
- 시리즈: {series}
- 페르소나: {persona}
- 핵심 팩트: {facts}
- 톤: {tone}
- 슬라이드 수: {slide_count}

# 작성 원칙 (6원칙)
1. 후킹 (hook)
2. 문제점 제시 (problem)
3. 해결책 (solution)
4. 의심제거 (doubt)
5. 희소성 (scarcity)
6. CTA

# 출력
JSON 배열로만 반환.
[{ "principle": "hook", "speaker": "uncle", "scene": "...",
   "main": "...", "sub": "...", "emphasis": ["..."] }]

# 절대 규칙
- 핵심 팩트 범위 밖의 수치/구조를 만들어내지 말 것
- 특정 보험사명을 적지 말 것
- "월 N만원" 같은 구체 보험료 금지
`;

// ─── 라이브러리 사진 ──────────────────────
export const LIBRARY_PHOTOS: LibraryPhoto[] = Array.from({ length: 18 }, (_, i) => ({
  id: 'ph' + i,
  src: `https://picsum.photos/seed/insu${i + 7}/400/400`,
  uses: Math.floor(i * 1.7) % 8,
  source: (i % 3 === 0 ? 'upload' : i % 3 === 1 ? 'unsplash' : 'library') as LibraryPhoto['source'],
}));
