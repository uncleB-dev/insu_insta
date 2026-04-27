'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { generateScript, type ScriptGenerationInput } from '@/lib/ai/gemini';
import type { Persona, Series } from '@/lib/supabase/types';

export type GeneratePostInput = {
  topic: string;
  series: Series;
  persona: Persona;
  facts: string;
  tone: 'soft' | 'normal' | 'strong';
  slideCount: number;
  cta: string;
};

export type GeneratePostResult = { postId?: string; error?: string };

export async function generatePostAction(
  input: GeneratePostInput,
): Promise<GeneratePostResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다' };

  // 1. Load active prompt
  const { data: prompt, error: promptError } = await supabase
    .from('prompts')
    .select('id, active_version_id')
    .eq('slug', 'script_generation')
    .maybeSingle();

  if (promptError || !prompt?.active_version_id) {
    return { error: '활성 프롬프트를 찾을 수 없습니다' };
  }

  const { data: version } = await supabase
    .from('prompt_versions')
    .select('body')
    .eq('id', prompt.active_version_id)
    .single();

  if (!version?.body) {
    return { error: '프롬프트 본문을 불러올 수 없습니다' };
  }

  // 2. Call Gemini
  const aiInput: ScriptGenerationInput = {
    topic: input.topic,
    series: input.series,
    persona: input.persona,
    facts: input.facts,
    tone: input.tone,
    slideCount: input.slideCount,
    cta: input.cta,
    promptBody: version.body,
  };

  let slides;
  try {
    slides = await generateScript(aiInput);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'AI 생성 실패';
    return { error: `AI 생성 실패: ${msg}` };
  }

  // 3. Create post + slides in a single ordered insert sequence
  const { data: post, error: postErr } = await supabase
    .from('posts')
    .insert({
      owner_id: user.id,
      title: input.topic.slice(0, 80),
      series: input.series,
      persona: input.persona,
      status: 'draft',
      topic: input.topic,
      facts: input.facts,
      tone: input.tone,
      cta_kind: input.cta,
    })
    .select('id')
    .single();

  if (postErr || !post) {
    return { error: `게시물 생성 실패: ${postErr?.message ?? 'unknown'}` };
  }

  const slideRows = slides.map((s, i) => ({
    post_id: post.id,
    ord: i + 1,
    principle: s.principle,
    speaker: s.speaker,
    scene: s.scene,
    main_text: s.main,
    sub_text: s.sub,
    emphasis: s.emphasis,
  }));

  const { error: slidesErr } = await supabase.from('slides').insert(slideRows);

  if (slidesErr) {
    // Best-effort cleanup
    await supabase.from('posts').delete().eq('id', post.id);
    return { error: `슬라이드 생성 실패: ${slidesErr.message}` };
  }

  revalidatePath('/');
  revalidatePath('/posts');
  return { postId: post.id };
}
