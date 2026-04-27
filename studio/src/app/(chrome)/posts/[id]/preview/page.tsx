'use client';

import { useRouter, useParams } from 'next/navigation';
import { PreviewBody } from '@/components/post/PreviewBody';

export default function PreviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[24px]">4️⃣</span>
          <h1 className="text-[24px] font-bold m-0 tracking-tight">미리보기 & 다운로드</h1>
        </div>
        <button
          className="px-3 py-2 rounded-lg text-[13px] font-medium transition-colors"
          style={{ color: 'var(--text-secondary)', background: 'transparent' }}
          onClick={() => router.push(`/posts/${params.id}/design`)}
          onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          ← 디자인으로
        </button>
      </div>

      <PreviewBody postId={params.id} />
    </div>
  );
}
