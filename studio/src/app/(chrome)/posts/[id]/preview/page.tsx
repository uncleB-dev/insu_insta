import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PreviewBody } from '@/components/post/PreviewBody';
import { loadPreviewBundle } from '@/lib/preview';

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bundle = await loadPreviewBundle(id);
  if (!bundle) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[24px]">4️⃣</span>
          <h1 className="text-[24px] font-bold m-0 tracking-tight">미리보기 & 다운로드</h1>
        </div>
        <Link
          href={`/posts/${id}/design`}
          className="px-3 py-2 rounded-lg text-[13px] font-medium transition-colors no-underline"
          style={{ color: 'var(--text-secondary)', background: 'transparent' }}
        >
          ← 디자인으로
        </Link>
      </div>

      <PreviewBody
        postId={bundle.postId}
        initialCaption={bundle.caption}
        initialStatus={bundle.status}
        initialScheduleAt={bundle.scheduleAt}
        initialHashtags={bundle.hashtags}
        initialCtaKind={bundle.ctaKind}
        initialRewardLink={bundle.rewardLink}
        slides={bundle.slides}
      />
    </div>
  );
}
