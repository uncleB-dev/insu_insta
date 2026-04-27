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
