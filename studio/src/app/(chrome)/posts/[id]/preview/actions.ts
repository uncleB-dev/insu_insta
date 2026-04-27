'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { HashtagCategory, PostStatus } from '@/lib/supabase/types';

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
