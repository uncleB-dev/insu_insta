'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { POSTS, PERSONAS } from '@/lib/mock';
import { StatusBadge } from '@/components/post/StatusBadge';
import { PreviewBody } from '@/components/post/PreviewBody';

export default function PostDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const post = POSTS.find(p => p.id === params.id) ?? POSTS[0];

  const handleClone = () => {
    toast('✓ 게시물 복제 완료');
  };

  const handleDelete = () => {
    setShowDeleteConfirm(false);
    toast('게시물이 삭제되었습니다');
    router.push('/posts');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <button
            className="text-[13px] w-fit transition-colors mb-1"
            style={{ color: 'var(--text-muted)', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            onClick={() => router.push('/posts')}
            onMouseOver={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
            onMouseOut={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            ← 히스토리
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-bold m-0 tracking-tight">{post.title}</h1>
            <StatusBadge status={post.status} />
          </div>
          <div className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            <span>{post.series}</span>
            <span>·</span>
            <span>{PERSONAS[post.persona]}</span>
            <span>·</span>
            <span>{post.updated}</span>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-2 rounded-lg text-[13px] font-medium transition-colors"
            style={{ color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}
            onClick={handleClone}
            onMouseOver={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseOut={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            📋 복제
          </button>
          <button
            className="px-3 py-2 rounded-lg text-[13px] font-medium transition-colors"
            style={{ color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}
            onClick={() => setShowDeleteConfirm(true)}
            onMouseOver={e => (e.currentTarget.style.color = 'var(--status-red)')}
            onMouseOut={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            🗑️ 삭제
          </button>
          <button
            className="px-3 py-2 rounded-lg text-[13px] font-semibold transition-colors"
            style={{ background: 'var(--brand-accent)', color: '#003320', border: 'none' }}
            onClick={() => router.push(`/posts/${post.id}/script`)}
            onMouseOver={e => (e.currentTarget.style.background = 'var(--brand-accent-hover)')}
            onMouseOut={e => (e.currentTarget.style.background = 'var(--brand-accent)')}
          >
            ✏️ 편집
          </button>
        </div>
      </div>

      {/* 단계 이동 탭 */}
      <div
        className="flex gap-1 p-1 rounded-xl"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
      >
        {([
          ['script', '2️⃣ 스크립트'],
          ['design', '3️⃣ 디자인'],
          ['preview', '4️⃣ 미리보기'],
        ] as const).map(([step, label]) => (
          <button
            key={step}
            className="flex-1 py-2 px-3 rounded-lg text-[13px] font-medium transition-colors"
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            onClick={() => router.push(`/posts/${post.id}/${step}`)}
            onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 프리뷰 바디 */}
      <PreviewBody postId={params.id} />

      {/* 삭제 확인 다이얼로그 */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="flex flex-col gap-4 p-7 rounded-2xl border"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', width: 400 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="text-[20px] font-bold">게시물 삭제</div>
            <p className="text-[14px] m-0" style={{ color: 'var(--text-secondary)' }}>
              "{post.title}"을 삭제하면 복구할 수 없습니다. 정말 삭제할까요?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                className="px-4 py-2 rounded-lg text-[14px] font-medium transition-colors"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                onClick={() => setShowDeleteConfirm(false)}
              >
                취소
              </button>
              <button
                className="px-4 py-2 rounded-lg text-[14px] font-semibold transition-colors"
                style={{ background: 'var(--status-red)', color: '#fff', border: 'none' }}
                onClick={handleDelete}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
