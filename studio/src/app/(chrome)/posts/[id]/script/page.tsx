import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ScriptEditorClient } from '@/components/post/ScriptEditorClient';
import { evaluateGuards, type GuardrailRule } from '@/lib/guardrails';
import type { EditorSlide } from '@/lib/editor';
import type { Principle, Speaker } from '@/lib/supabase/types';

type SlideRow = {
  id: string;
  ord: number;
  principle: Principle;
  speaker: Speaker;
  scene: string | null;
  main_text: string;
  sub_text: string | null;
  emphasis: string[];
};

export default async function ScriptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: post }, { data: slidesRows }, { data: rulesRows }] = await Promise.all([
    supabase.from('posts').select('id, title').eq('id', id).maybeSingle(),
    supabase
      .from('slides')
      .select('id, ord, principle, speaker, scene, main_text, sub_text, emphasis')
      .eq('post_id', id)
      .order('ord', { ascending: true }),
    supabase
      .from('guardrail_rules')
      .select('id, level, kind, pattern, replace_with, active')
      .eq('active', true),
  ]);

  if (!post) notFound();

  const rules = (rulesRows ?? []) as GuardrailRule[];
  const slides: EditorSlide[] = ((slidesRows ?? []) as SlideRow[]).map((row) => ({
    id: row.id,
    ord: row.ord,
    principle: row.principle,
    speaker: row.speaker,
    scene: row.scene ?? '',
    main: row.main_text,
    sub: row.sub_text ?? '',
    emphasis: row.emphasis ?? [],
    guards: evaluateGuards(row.main_text, rules),
  }));

  return <ScriptEditorClient postId={id} initialSlides={slides} rules={rules} />;
}
