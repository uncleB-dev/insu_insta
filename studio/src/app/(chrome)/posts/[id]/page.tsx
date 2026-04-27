import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StatusBadge } from '@/components/post/StatusBadge';
import { PreviewBody } from '@/components/post/PreviewBody';
import { PostHeaderActions } from '@/components/post/PostHeaderActions';
import { personaLabel, relativeTime, seriesShort } from '@/lib/format';

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: post, error } = await supabase
    .from('posts')
    .select('id, title, series, persona, status, updated_at')
    .eq('id', id)
    .maybeSingle();

  if (error || !post) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <Link
            href="/posts"
            className="text-[13px] w-fit transition-colors mb-1 no-underline"
            style={{ color: 'var(--text-muted)' }}
          >
            ← 히스토리
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-bold m-0 tracking-tight">{post.title}</h1>
            <StatusBadge status={post.status} />
          </div>
          <div
            className="flex items-center gap-2 text-[13px]"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span>{seriesShort(post.series)}</span>
            <span>·</span>
            <span>{personaLabel(post.persona)}</span>
            <span>·</span>
            <span>{relativeTime(post.updated_at)}</span>
          </div>
        </div>

        <PostHeaderActions postId={post.id} postTitle={post.title} />
      </div>

      <div
        className="flex gap-1 p-1 rounded-xl"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
      >
        {(
          [
            ['script', '2️⃣ 스크립트'],
            ['design', '3️⃣ 디자인'],
            ['preview', '4️⃣ 미리보기'],
          ] as const
        ).map(([step, label]) => (
          <Link
            key={step}
            href={`/posts/${post.id}/${step}`}
            className="flex-1 py-2 px-3 rounded-lg text-[13px] font-medium transition-colors text-center no-underline"
            style={{
              background: 'transparent',
              color: 'var(--text-secondary)',
            }}
          >
            {label}
          </Link>
        ))}
      </div>

      <PreviewBody postId={post.id} />
    </div>
  );
}
