'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

/** Register an uploaded photo in library_photos table.
 * Storage upload itself is performed client-side directly (faster + bypasses
 * the 1MB Server Action body limit).
 *
 * The client passes the storage path it received from the upload call. */
export async function registerLibraryPhotoAction({
  storagePath,
  source,
}: {
  storagePath: string;
  source: 'upload' | 'unsplash' | 'library';
}): Promise<{ photo?: { id: string; src: string }; error?: string }> {
  if (!storagePath || !storagePath.trim()) return { error: 'storagePath required' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다' };

  const { data: pub } = supabase.storage.from('library').getPublicUrl(storagePath);
  const publicUrl = pub.publicUrl;

  const { data: row, error } = await supabase
    .from('library_photos')
    .insert({
      src: publicUrl,
      source,
      uses: 0,
      uploaded_by: user.id,
    })
    .select('id, src')
    .single();

  if (error || !row) return { error: error?.message ?? 'insert failed' };

  revalidatePath('/library');
  return { photo: { id: row.id, src: row.src } };
}

export async function deleteLibraryPhotoAction(
  photoId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();

  // Look up current src to derive storage path
  const { data: photo } = await supabase
    .from('library_photos')
    .select('src, uploaded_by')
    .eq('id', photoId)
    .maybeSingle();

  if (!photo) return { error: 'photo not found' };

  // Delete the DB row first (RLS confirms ownership). Storage cleanup is
  // best-effort because the bucket is public; orphan files are harmless.
  const { error } = await supabase.from('library_photos').delete().eq('id', photoId);
  if (error) return { error: error.message };

  // Best-effort storage cleanup: parse the path from the public URL
  const match = photo.src.match(/\/library\/(.+)$/);
  if (match?.[1]) {
    await supabase.storage.from('library').remove([decodeURIComponent(match[1])]);
  }

  revalidatePath('/library');
  return {};
}
