'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { evaluateGuards, type GuardrailRule } from '@/lib/guardrails';
import type { Principle, Speaker } from '@/lib/supabase/types';
import type { EditorSlide } from '@/lib/editor';

export type SlidePatch = {
  principle?: Principle;
  speaker?: Speaker;
  scene?: string | null;
  main_text?: string;
  sub_text?: string | null;
  emphasis?: string[];
  // slide-header-multi-msg: additional bubbles
  main_text2?: string | null;
  main_text3?: string | null;
  main_text4?: string | null;
  speaker2?: Speaker | null;
  speaker3?: Speaker | null;
  speaker4?: Speaker | null;
};

async function loadActiveRules(): Promise<GuardrailRule[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('guardrail_rules')
    .select('id, level, kind, pattern, replace_with, active')
    .eq('active', true);
  return (data ?? []) as GuardrailRule[];
}

type SlideRowFull = {
  id: string;
  ord: number;
  principle: Principle;
  speaker: Speaker;
  scene: string | null;
  main_text: string;
  sub_text: string | null;
  emphasis: string[];
  layout?: string | null;
  main_text2?: string | null;
  main_text3?: string | null;
  main_text4?: string | null;
  speaker2?: Speaker | null;
  speaker3?: Speaker | null;
  speaker4?: Speaker | null;
};

function rowToSlide(row: SlideRowFull, rules: GuardrailRule[]): EditorSlide {
  return {
    id: row.id,
    ord: row.ord,
    principle: row.principle,
    speaker: row.speaker,
    scene: row.scene ?? '',
    main: row.main_text,
    sub: row.sub_text ?? '',
    emphasis: row.emphasis ?? [],
    guards: evaluateGuards(row.main_text, rules),
    layout: row.layout ?? null,
    main2: row.main_text2 ?? null,
    main3: row.main_text3 ?? null,
    main4: row.main_text4 ?? null,
    speaker2: row.speaker2 ?? null,
    speaker3: row.speaker3 ?? null,
    speaker4: row.speaker4 ?? null,
  };
}

export async function updateSlideAction(
  slideId: string,
  patch: SlidePatch,
): Promise<{ slide?: EditorSlide; error?: string }> {
  const supabase = await createClient();

  const { data: row, error } = await supabase
    .from('slides')
    .update(patch)
    .eq('id', slideId)
    .select(
      'id, ord, principle, speaker, scene, main_text, sub_text, emphasis, layout, main_text2, main_text3, main_text4, speaker2, speaker3, speaker4, post_id',
    )
    .single();

  if (error || !row) return { error: error?.message ?? 'slide not found' };

  const rules = await loadActiveRules();
  revalidatePath(`/posts/${row.post_id}/script`);
  return { slide: rowToSlide(row, rules) };
}

export async function addSlideAction(
  postId: string,
): Promise<{ slide?: EditorSlide; error?: string }> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('slides')
    .select('ord')
    .eq('post_id', postId)
    .order('ord', { ascending: false })
    .limit(1);

  const nextOrd = (existing?.[0]?.ord ?? 0) + 1;

  const { data: row, error } = await supabase
    .from('slides')
    .insert({
      post_id: postId,
      ord: nextOrd,
      principle: 'hook',
      speaker: 'none',
      scene: '',
      main_text: '새 슬라이드',
      sub_text: '',
      emphasis: [],
    })
    .select(
      'id, ord, principle, speaker, scene, main_text, sub_text, emphasis, layout, main_text2, main_text3, main_text4, speaker2, speaker3, speaker4',
    )
    .single();

  if (error || !row) return { error: error?.message ?? 'failed to add' };

  const rules = await loadActiveRules();
  revalidatePath(`/posts/${postId}/script`);
  return { slide: rowToSlide(row, rules) };
}

export async function deleteSlideAction(
  slideId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { data: row } = await supabase
    .from('slides')
    .select('post_id')
    .eq('id', slideId)
    .single();

  const { error } = await supabase.from('slides').delete().eq('id', slideId);
  if (error) return { error: error.message };

  if (row?.post_id) revalidatePath(`/posts/${row.post_id}/script`);
  return {};
}
