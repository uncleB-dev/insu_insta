// Gemini client wrapper. Server-side only.
// Docs: https://ai.google.dev/gemini-api/docs

import { GoogleGenAI, Type } from '@google/genai';

const TEXT_MODEL = 'gemini-2.5-flash';
const IMAGE_MODEL = 'gemini-2.5-flash-image'; // aka Nano Banana

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment');
  }
  return new GoogleGenAI({ apiKey });
}

export type GeneratedSlide = {
  principle: 'hook' | 'problem' | 'solution' | 'doubt' | 'scarcity' | 'cta';
  speaker: 'niece' | 'uncle' | 'none';
  scene: string;
  main: string;
  sub: string;
  emphasis: string[];
};

export type ScriptGenerationInput = {
  topic: string;
  series: 'A' | 'B' | 'C';
  persona: '30s_office' | 'newbie' | 'parent' | 'newlywed';
  facts: string;
  tone: 'soft' | 'normal' | 'strong';
  slideCount: number;
  cta: string;
  rewardLink?: string | null;
  promptBody: string;
};

const SLIDE_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    required: ['principle', 'speaker', 'scene', 'main', 'sub', 'emphasis'],
    properties: {
      principle: {
        type: Type.STRING,
        enum: ['hook', 'problem', 'solution', 'doubt', 'scarcity', 'cta'],
      },
      speaker: {
        type: Type.STRING,
        enum: ['niece', 'uncle', 'none'],
      },
      scene: { type: Type.STRING, description: '슬라이드의 비주얼 묘사' },
      main: { type: Type.STRING, description: '슬라이드 메인 텍스트' },
      sub: { type: Type.STRING, description: '슬라이드 보조 텍스트' },
      emphasis: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: '메인 텍스트 안에서 볼드 처리할 단어/구',
      },
    },
  },
};

const SERIES_LABEL: Record<ScriptGenerationInput['series'], string> = {
  A: '시리즈 A · 잘못된 보험 정리',
  B: '시리즈 B · 가족 보험 정리',
  C: '시리즈 C · 생애 이벤트',
};

const PERSONA_LABEL: Record<ScriptGenerationInput['persona'], string> = {
  '30s_office': '30대 직장인',
  newbie: '사회 초년생',
  parent: '부모 세대',
  newlywed: '신혼 부부',
};

const TONE_LABEL: Record<ScriptGenerationInput['tone'], string> = {
  soft: '부드러움',
  normal: '보통',
  strong: '단호함',
};

function buildPrompt(input: ScriptGenerationInput): string {
  let body = input.promptBody;

  const replacements: Record<string, string> = {
    '{{topic}}': input.topic,
    '{{series}}': SERIES_LABEL[input.series],
    '{{persona}}': PERSONA_LABEL[input.persona],
    '{{facts}}': input.facts,
    '{{tone}}': TONE_LABEL[input.tone],
    '{{slide_count}}': String(input.slideCount),
    '{{cta}}': input.cta,
    // legacy single-brace placeholders
    '{topic}': input.topic,
    '{series}': SERIES_LABEL[input.series],
    '{persona}': PERSONA_LABEL[input.persona],
    '{facts}': input.facts,
    '{tone}': TONE_LABEL[input.tone],
    '{slide_count}': String(input.slideCount),
    '{cta}': input.cta,
  };

  for (const [k, v] of Object.entries(replacements)) {
    body = body.replaceAll(k, v);
  }

  // engagement-polish module 2: 댓글 유도 CTA 시 추가 지시문
  // (reward_link는 작성자가 댓글 단 사람들에게 사적으로 발송 — AI에 노출 X)
  if (input.cta === 'comment_link') {
    body +=
      '\n\n# 댓글 유도 CTA 추가 지시 (필수)\n' +
      `이 게시물의 마지막 슬라이드(CTA)는 "댓글 유도" 형태로 작성하세요.\n` +
      `독자가 댓글에 특정 키워드(주제에 어울리는 1~2자, 예: "체크", "필요", "도움", "요청" 등)를 적도록 자연스럽게 유도하세요.\n` +
      `**작성자가 댓글 단 사람에게 따로 자료를 보낼 예정**이므로, "DM/댓글로 자료 보내드려요" 같은 안내만 표현하고\n` +
      `절대 URL/링크 주소를 슬라이드에 노출하지 마세요.\n\n` +
      `예시 톤: "👇 댓글에 'OO' 남겨주시면 우리 가족 보험 점검 가이드 보내드릴게요"\n` +
      `광고 심의에 걸리지 않도록 단정적 표현·과장 금지.`;
  }

  return body;
}

export async function generateScript(input: ScriptGenerationInput): Promise<GeneratedSlide[]> {
  const ai = getClient();
  const prompt = buildPrompt(input);

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: SLIDE_SCHEMA,
      temperature: 0.7,
    },
  });

  const text = response.text;
  if (!text) throw new Error('Gemini returned empty response');

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Gemini response was not valid JSON');
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Gemini response was not an array');
  }

  const slides: GeneratedSlide[] = parsed.map((s, i) => {
    const obj = s as Record<string, unknown>;
    return {
      principle: (obj.principle as GeneratedSlide['principle']) ?? 'hook',
      speaker: (obj.speaker as GeneratedSlide['speaker']) ?? 'none',
      scene: String(obj.scene ?? ''),
      main: String(obj.main ?? `슬라이드 ${i + 1}`),
      sub: String(obj.sub ?? ''),
      emphasis: Array.isArray(obj.emphasis)
        ? (obj.emphasis as unknown[]).map((e) => String(e))
        : [],
    };
  });

  if (slides.length === 0) throw new Error('Gemini returned no slides');
  return slides;
}

// ─── engagement-polish module 3: Caption + Hashtags with grounded search ──
export type CaptionHashtagInput = {
  topic: string;
  facts: string;
  persona: ScriptGenerationInput['persona'];
  series: ScriptGenerationInput['series'];
  cta: string;
  rewardLink: string | null;
  slides: Array<{
    ord: number;
    principle: string;
    main: string;
    sub: string;
  }>;
};

export type CaptionHashtagResult = {
  caption: string;
  hashtags: {
    brand: string[];
    topic: string[];
    target: string[];
    general: string[];
  };
};

export async function generateCaptionAndHashtags(
  input: CaptionHashtagInput,
): Promise<CaptionHashtagResult> {
  const ai = getClient();

  const slidesText = input.slides
    .map((s) => `[${s.ord}컷 ${s.principle}] ${s.main}${s.sub ? ' / ' + s.sub : ''}`)
    .join('\n');

  const ctaSection =
    input.cta === 'comment_link'
      ? `\n# CTA 모드: 댓글 유도\n` +
        `캡션 마지막 단락에 다음을 자연스럽게 안내하세요:\n` +
        `- 댓글에 특정 키워드(주제에 어울리는 1~2자, 예: '체크' '필요' '도움' '요청' 등)를 적도록 유도\n` +
        `- 댓글 단 사람에게는 작성자(보험삼촌)가 따로 자료를 보내드린다고 안내\n` +
        `- **URL/링크 주소는 절대 캡션에 포함하지 마세요** (작성자가 사적으로 발송)\n` +
        `- 단정적/과장 표현 금지 (광고 심의)\n`
      : `\n# CTA 모드: ${input.cta}\n캡션 마지막 단락에 자연스럽게 ${
          input.cta === 'save' ? '저장' :
          input.cta === 'share' ? '가족·지인 공유' :
          input.cta === 'dm' ? 'DM 문의' :
          input.cta === 'link' ? '프로필 링크 클릭' :
          '행동'
        }을 유도하세요.\n`;

  const personaLabel = PERSONA_LABEL[input.persona];

  const prompt = `당신은 한국 보험설계사 "보험삼촌 BEN"의 인스타그램 캡션과 해시태그를 작성하는 전문 카피라이터입니다.

게시물 정보를 보고, **검색을 통해 최신 통계나 트렌드가 있다면 적극 활용**해서 가장 매력적인 캡션과 해시태그를 만드세요.

# 게시물 주제
${input.topic}

# 핵심 팩트 (이 범위 안에서만 작성)
${input.facts}

# 타겟 페르소나
${personaLabel}

# 9컷 슬라이드 내용
${slidesText}
${ctaSection}

# 캡션 작성 규칙
- 한국어, 친근한 반말, "삼촌이 알려주는 듯한" 톤
- 약 400~600자 (목표 500자)
- **첫 80자에 강력한 후킹** (인스타그램 미리보기에서 잘리는 길이 대비)
- 슬라이드 9컷의 핵심을 자연스러운 스토리텔링으로 압축
- 마지막 1~2단락에 CTA
- 단락 사이는 빈 줄 1개로 구분
- 이모지는 적절히 (3~5개)

# 해시태그 작성 규칙
- 최소 7개, 최대 15개
- 4개 카테고리에 분산:
  * brand: 브랜드 (보험삼촌, 보험삼촌BEN, unclebstudio 항상 포함)
  * topic: 주제 (해당 게시물 주제 기반, 2~4개)
  * target: 타겟 페르소나 관련 (2~3개)
  * general: 일반 보험 상식 관련 (2~3개)
- '#' 기호 없이 단어만 (예: '암보험' OK, '#암보험' X)
- 한국어 위주, 영문은 브랜드만

# 절대 규칙
- 핵심 팩트 범위 밖의 수치 만들지 말 것
- 특정 보험사명 적지 말 것
- "월 N만원" 같은 구체 보험료 금지
- 단정적 표현("무조건", "100%", "확실") 금지

# 출력 (JSON)
{
  "caption": "...",
  "hashtags": {
    "brand": ["보험삼촌", "보험삼촌BEN", "unclebstudio"],
    "topic": ["...", "..."],
    "target": ["...", "..."],
    "general": ["...", "..."]
  }
}

JSON만 반환하고 다른 텍스트는 절대 포함하지 마세요.`;

  // Note: grounded search 사용 시 responseSchema 동시 사용 불가.
  // 따라서 검색은 켜되 JSON 출력은 프롬프트로 강제하고 파싱.
  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      temperature: 0.8,
    },
  });

  const text = response.text;
  if (!text) throw new Error('Gemini returned empty response');

  // Extract JSON from response (sometimes wrapped in markdown code fence)
  let jsonText = text.trim();
  const fenced = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) jsonText = fenced[1].trim();
  const start = jsonText.indexOf('{');
  const end = jsonText.lastIndexOf('}');
  if (start >= 0 && end >= 0) jsonText = jsonText.slice(start, end + 1);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error('Gemini caption response was not valid JSON');
  }

  const obj = parsed as Record<string, unknown>;
  const caption = String(obj.caption ?? '');
  const tagsObj = (obj.hashtags ?? {}) as Record<string, unknown>;

  const normTags = (v: unknown): string[] =>
    Array.isArray(v) ? v.map((x) => String(x).replace(/^#+/, '').trim()).filter(Boolean) : [];

  const hashtags = {
    brand: normTags(tagsObj.brand),
    topic: normTags(tagsObj.topic),
    target: normTags(tagsObj.target),
    general: normTags(tagsObj.general),
  };

  // Ensure brand defaults
  for (const required of ['보험삼촌', '보험삼촌BEN', 'unclebstudio']) {
    if (!hashtags.brand.includes(required)) hashtags.brand.push(required);
  }

  if (!caption) throw new Error('Gemini returned empty caption');

  return { caption, hashtags };
}

// ─── Nano Banana (image generation) — B-2 phase ──────────────
// Used in /posts/[id]/design page to generate slide background images.
export async function generateImage(prompt: string): Promise<{ data: string; mimeType: string }> {
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: prompt,
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      return {
        data: part.inlineData.data,
        mimeType: part.inlineData.mimeType ?? 'image/png',
      };
    }
  }
  throw new Error('Gemini did not return an image');
}
