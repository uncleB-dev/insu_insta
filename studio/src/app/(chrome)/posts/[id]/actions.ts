'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function deletePostAction(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/posts');
  revalidatePath('/');
  redirect('/posts');
}
