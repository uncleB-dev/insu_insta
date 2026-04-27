import { createClient } from '@/lib/supabase/server';
import { PostsListClient, type PostRow } from '@/components/posts/PostsListClient';

export default async function PostsPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from('posts')
    .select('id, title, series, persona, status, updated_at')
    .order('updated_at', { ascending: false });

  const posts: PostRow[] = data ?? [];

  return <PostsListClient posts={posts} />;
}
