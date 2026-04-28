'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { HashtagCategory, PostStatus } from '@/lib/supabase/types';
import { generateCaptionAndHashtags } from '@/lib/ai/gemini';

export async function updateCaptionAction(
  postId: string,
  caption: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('posts')
    .update({ caption })
    .eq('id', postId);
  if (error) return { error: error.message };
  revalidatePath(`/posts/${postId}/preview`);
  revalidatePath(`/posts/${postId}`);
  return {};
}

export async function updateRewardLinkAction(
  postId: string,
  rewardLink: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('posts')
    .update({ reward_link: rewardLink || null })
    .eq('id', postId);
  if (error) return { error: error.message };
  revalidatePath(`/posts/${postId}/preview`);
  revalidatePath(`/posts/${postId}`);
  return {};
}

export async function updatePostHeaderAction(
  postId: string,
  headerText: string,
  headerImageUrl: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('posts')
    .update({
      header_text: headerText || null,
      header_image_url: headerImageUrl || null,
    })
    .eq('id', postId);
  if (error) return { error: error.message };
  revalidatePath(`/posts/${postId}/preview`);
  revalidatePath(`/posts/${postId}`);
  revalidatePath(`/posts/${postId}/design`);
  return {};
}

// engagement-polish module 3: AI caption + hashtag generator with grounded search
export async function generateCaptionHashtagsAction(
  postId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();

  // 1. Load post + slides
  const { data: post } = await supabase
    .from('posts')
    .select('topic, facts, persona, series, cta_kind, reward_link')
    .eq('id', postId)
    .single();

  if (!post) return { error: '게시물을 찾을 수 없습니다' };

  const { data: slides } = await supabase
    .from('slides')
    .select('ord, principle, main_text, sub_text')
    .eq('post_id', postId)
    .order('ord', { ascending: true });

  if (!slides || slides.length === 0) {
    return { error: '슬라이드가 없습니다. 먼저 스크립트를 만들어주세요' };
  }

  // 2. Call Gemini grounded search
  let result;
  try {
    result = await generateCaptionAndHashtags({
      topic: post.topic ?? '',
      facts: post.facts ?? '',
      persona: post.persona,
      series: post.series,
      cta: post.cta_kind ?? 'save',
      rewardLink: post.reward_link,
      slides: slides.map((s) => ({
        ord: s.ord,
        principle: s.principle,
        main: s.main_text,
        sub: s.sub_text ?? '',
      })),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'AI 생성 실패';
    return { error: msg };
  }

  // 3. Save caption
  await supabase.from('posts').update({ caption: result.caption }).eq('id', postId);

  // 4. Replace hashtags (delete all + insert new)
  await supabase.from('hashtags').delete().eq('post_id', postId);

  const tagRows: Array<{ post_id: string; category: HashtagCategory; tag: string }> = [];
  for (const cat of ['brand', 'topic', 'target', 'general'] as const) {
    for (const tag of result.hashtags[cat] ?? []) {
      const clean = tag.replace(/^#+/, '').trim();
      if (clean) tagRows.push({ post_id: postId, category: cat, tag: clean });
    }
  }
  if (tagRows.length > 0) {
    await supabase.from('hashtags').insert(tagRows);
  }

  revalidatePath(`/posts/${postId}/preview`);
  revalidatePath(`/posts/${postId}`);
  return {};
}

export async function updatePostStatusAction(
  postId: string,
  status: PostStatus,
  scheduleAt: string | null,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('posts')
    .update({
      status,
      schedule_at: status === 'scheduled' ? scheduleAt : null,
    })
    .eq('id', postId);
  if (error) return { error: error.message };
  revalidatePath(`/posts/${postId}/preview`);
  revalidatePath(`/posts/${postId}`);
  revalidatePath('/posts');
  revalidatePath('/');
  return {};
}

export async function addHashtagAction(
  postId: string,
  category: HashtagCategory,
  tag: string,
): Promise<{ error?: string }> {
  const trimmed = tag.replace(/^#+/, '').trim();
  if (!trimmed) return { error: '태그가 비어있습니다' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('hashtags')
    .insert({ post_id: postId, category, tag: trimmed });

  if (error) {
    // Unique constraint violation = tag already exists; treat as success
    if (error.code === '23505') return {};
    return { error: error.message };
  }
  revalidatePath(`/posts/${postId}/preview`);
  revalidatePath(`/posts/${postId}`);
  return {};
}

export async function removeHashtagAction(
  postId: string,
  category: HashtagCategory,
  tag: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('hashtags')
    .delete()
    .eq('post_id', postId)
    .eq('category', category)
    .eq('tag', tag);
  if (error) return { error: error.message };
  revalidatePath(`/posts/${postId}/preview`);
  revalidatePath(`/posts/${postId}`);
  return {};
}
