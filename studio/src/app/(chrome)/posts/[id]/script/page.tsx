import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ScriptOneScreenEditor } from '@/components/post/ScriptOneScreenEditor';
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
  layout: string | null;
  main_text2: string | null;
  main_text3: string | null;
  main_text4: string | null;
  speaker2: Speaker | null;
  speaker3: Speaker | null;
  speaker4: Speaker | null;
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
      .select(
        'id, ord, principle, speaker, scene, main_text, sub_text, emphasis, layout, main_text2, main_text3, main_text4, speaker2, speaker3, speaker4',
      )
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
    layout: row.layout,
    main2: row.main_text2,
    main3: row.main_text3,
    main4: row.main_text4,
    speaker2: row.speaker2,
    speaker3: row.speaker3,
    speaker4: row.speaker4,
  }));

  return (
    <ScriptOneScreenEditor
      postId={id}
      postTitle={post.title ?? ''}
      initialSlides={slides}
      rules={rules}
    />
  );
}
