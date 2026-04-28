'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { generateImage } from '@/lib/ai/gemini';

export type DesignPatch = {
  layout?: string;
  blur?: number;
  overlay?: number;
  text_pos?: string;
  accent_color?: string;
  bg_photo_id?: string | null;
  main_font_size?: number | null;
  sub_font_size?: number | null;
  line_height?: number | null;
};

export async function updateSlideDesignAction(
  slideId: string,
  patch: DesignPatch,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from('slides')
    .update(patch)
    .eq('id', slideId)
    .select('post_id')
    .single();

  if (error) return { error: error.message };
  if (row?.post_id) revalidatePath(`/posts/${row.post_id}/design`);
  return {};
}

export async function applyDesignToAllAction(
  postId: string,
  patch: DesignPatch,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('slides')
    .update(patch)
    .eq('post_id', postId);
  if (error) return { error: error.message };
  revalidatePath(`/posts/${postId}/design`);
  return {};
}

export type GeneratedPhoto = {
  id: string;
  src: string;
};

/** Generate a background image with Nano Banana, upload to Storage,
 * insert into library_photos, optionally bind to slide. */
export async function generateBackgroundAction({
  prompt,
  slideId,
  bindToSlide = true,
}: {
  prompt: string;
  slideId?: string;
  bindToSlide?: boolean;
}): Promise<{ photo?: GeneratedPhoto; error?: string }> {
  if (!prompt || !prompt.trim()) return { error: '프롬프트가 필요합니다' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다' };

  // 1) Gemini Nano Banana
  let result;
  try {
    result = await generateImage(prompt);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'image gen failed';
    return { error: `이미지 생성 실패: ${msg}` };
  }

  // 2) Upload to Storage
  const buffer = Buffer.from(result.data, 'base64');
  const ext = result.mimeType === 'image/jpeg' ? 'jpg' : result.mimeType === 'image/webp' ? 'webp' : 'png';
  const path = `${user.id}/${Date.now()}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from('library')
    .upload(path, buffer, {
      contentType: result.mimeType,
      upsert: false,
    });

  if (uploadErr) return { error: `업로드 실패: ${uploadErr.message}` };

  // 3) Public URL
  const { data: pub } = supabase.storage.from('library').getPublicUrl(path);
  const publicUrl = pub.publicUrl;

  // 4) library_photos 레코드 생성
  const { data: photo, error: insErr } = await supabase
    .from('library_photos')
    .insert({
      src: publicUrl,
      source: 'upload',
      uses: 0,
      uploaded_by: user.id,
    })
    .select('id, src')
    .single();

  if (insErr || !photo) {
    return { error: `라이브러리 등록 실패: ${insErr?.message ?? 'unknown'}` };
  }

  // 5) bind to slide
  if (bindToSlide && slideId) {
    const { data: row } = await supabase
      .from('slides')
      .update({ bg_photo_id: photo.id })
      .eq('id', slideId)
      .select('post_id')
      .single();
    if (row?.post_id) revalidatePath(`/posts/${row.post_id}/design`);
  }

  return { photo: { id: photo.id, src: photo.src } };
}

export async function setSlideBackgroundAction(
  slideId: string,
  photoId: string | null,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from('slides')
    .update({ bg_photo_id: photoId })
    .eq('id', slideId)
    .select('post_id')
    .single();
  if (error) return { error: error.message };
  if (row?.post_id) revalidatePath(`/posts/${row.post_id}/design`);
  return {};
}
