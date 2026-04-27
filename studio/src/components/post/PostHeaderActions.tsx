'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { deletePostAction } from '@/app/(chrome)/posts/[id]/actions';

export function PostHeaderActions({ postId, postTitle }: { postId: string; postTitle: string }) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleClone = () => toast('복제 기능은 곧 구현됩니다');

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deletePostAction(postId);
      if (res?.error) {
        toast.error(`삭제 실패: ${res.error}`);
        setShowConfirm(false);
        return;
      }
      toast('게시물이 삭제되었습니다');
    });
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          className="px-3 py-2 rounded-lg text-[13px] font-medium transition-colors"
          style={{ color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}
          onClick={handleClone}
        >
          📋 복제
        </button>
        <button
          className="px-3 py-2 rounded-lg text-[13px] font-medium transition-colors"
          style={{ color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}
          onClick={() => setShowConfirm(true)}
        >
          🗑️ 삭제
        </button>
        <button
          className="px-3 py-2 rounded-lg text-[13px] font-semibold transition-colors"
          style={{ background: 'var(--brand-accent)', color: '#003320', border: 'none' }}
          onClick={() => router.push(`/posts/${postId}/script`)}
        >
          ✏️ 편집
        </button>
      </div>

      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => !isPending && setShowConfirm(false)}
        >
          <div
            className="flex flex-col gap-4 p-7 rounded-2xl border"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', width: 400 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[20px] font-bold">게시물 삭제</div>
            <p className="text-[14px] m-0" style={{ color: 'var(--text-secondary)' }}>
              "{postTitle}"을 삭제하면 복구할 수 없습니다. 정말 삭제할까요?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                className="px-4 py-2 rounded-lg text-[14px] font-medium"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                onClick={() => setShowConfirm(false)}
                disabled={isPending}
              >
                취소
              </button>
              <button
                className="px-4 py-2 rounded-lg text-[14px] font-semibold disabled:opacity-50"
                style={{ background: 'var(--status-red)', color: '#fff', border: 'none' }}
                onClick={handleDelete}
                disabled={isPending}
              >
                {isPending ? '삭제 중…' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
