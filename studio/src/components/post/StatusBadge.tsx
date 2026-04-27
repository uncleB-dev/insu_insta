import type { PostStatus } from '@/lib/mock';
import { cn } from '@/lib/utils';

const STATUS_MAP: Record<PostStatus, { label: string; cls: string }> = {
  published: {
    label: '게시',
    cls: 'text-[var(--brand-accent)] border-[rgba(0,255,136,0.3)]',
  },
  draft: {
    label: '초안',
    cls: 'text-[var(--text-secondary)] border-[var(--border)]',
  },
  scheduled: {
    label: '예정',
    cls: 'text-[#4DA6FF] border-[rgba(77,166,255,0.3)]',
  },
};

export function StatusBadge({ status, long }: { status: PostStatus; long?: boolean }) {
  const { label, cls } = STATUS_MAP[status];
  const fullLabel = long
    ? { published: '게시 완료', draft: '초안', scheduled: '게시 예정' }[status]
    : label;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border',
        cls,
        status === 'published' && 'bg-[var(--brand-accent-bg)]',
        status === 'scheduled' && 'bg-[rgba(77,166,255,0.12)]'
      )}
    >
      {fullLabel}
    </span>
  );
}
