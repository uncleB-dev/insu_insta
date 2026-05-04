'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Persona, Series } from '@/lib/supabase/types';

// manual-flow-redesign §7.2: AI script generation removed.
// /posts/new now just creates blank slides; user authors content manually.

export type CreatePostInput = {
  topic: string;
  series: Series;
  persona: Persona;
  slideCount: number;
  cta: string;
  rewardLink?: string | null;
};

export type CreatePostResult = { postId?: string; error?: string };

// Default principle distribution for N cards (user can change in script editor)
function defaultPrincipleFor(idx: number, total: number): string {
  // 6원칙 분포: 1=hook, 2~30%=problem, 30~55%=solution, 55~70%=doubt, 70~85%=scarcity, 85~100%=cta
  if (idx === 0) return 'hook';
  const ratio = idx / Math.max(total - 1, 1);
  if (ratio < 0.3) return 'problem';
  if (ratio < 0.55) return 'solution';
  if (ratio < 0.7) return 'doubt';
  if (ratio < 0.85) return 'scarcity';
  return 'cta';
}

function defaultSpeakerFor(idx: number, principle: string): 'niece' | 'uncle' | 'none' {
  // 1번 카드는 항상 niece (조카가 묻는 패턴)
  if (idx === 0) return 'niece';
  // 의심제거(doubt)는 조카가 의심하는 형태가 자연스러움
  if (principle === 'doubt') return 'niece';
  // 그 외 삼촌이 답
  return 'uncle';
}

export async function createBlankPostAction(
  input: CreatePostInput,
): Promise<CreatePostResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다' };

  if (!input.topic.trim()) return { error: '주제를 입력해주세요' };
  if (input.slideCount < 3 || input.slideCount > 15) {
    return { error: '카드 수는 3~15장 사이여야 합니다' };
  }

  // 1. Create post
  const { data: post, error: postErr } = await supabase
    .from('posts')
    .insert({
      owner_id: user.id,
      title: input.topic.slice(0, 80),
      series: input.series,
      persona: input.persona,
      status: 'draft',
      topic: input.topic,
      cta_kind: input.cta,
      reward_link: input.rewardLink ?? null,
    })
    .select('id')
    .single();

  if (postErr || !post) {
    return { error: `게시물 생성 실패: ${postErr?.message ?? 'unknown'}` };
  }

  // 2. Create blank slides with sensible default principle/speaker/layout
  const slideRows = Array.from({ length: input.slideCount }, (_, i) => {
    const principle = defaultPrincipleFor(i, input.slideCount);
    const speaker = defaultSpeakerFor(i, principle);
    const layout = speaker === 'uncle' ? 'msg_right' : 'msg_left';
    return {
      post_id: post.id,
      ord: i + 1,
      principle,
      speaker,
      scene: '',
      main_text: '',
      sub_text: '',
      emphasis: [],
      layout,
    };
  });

  const { error: slidesErr } = await supabase.from('slides').insert(slideRows);
  if (slidesErr) {
    await supabase.from('posts').delete().eq('id', post.id);
    return { error: `슬라이드 생성 실패: ${slidesErr.message}` };
  }

  revalidatePath('/');
  revalidatePath('/posts');
  return { postId: post.id };
}
