import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { StatusBadge } from '@/components/post/StatusBadge';
import { QuickStart } from '@/components/dashboard/QuickStart';
import { SeedDemoButton } from '@/components/dashboard/SeedDemoButton';
import { personaLabel, relativeTime, seriesShort } from '@/lib/format';

function StatCard({ num, label, accent }: { num: string; label: string; accent?: boolean }) {
  return (
    <div
      className="flex flex-col gap-1 p-5 rounded-xl border"
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
    >
      <div
        className="text-[28px] font-bold"
        style={{ color: accent ? 'var(--brand-accent)' : 'var(--text-primary)' }}
      >
        {num}
      </div>
      <div className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{label}</div>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ data: profile }, { data: posts }] = await Promise.all([
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return { data: null };
      return supabase.from('profiles').select('display_name, email').eq('id', data.user.id).single();
    }),
    supabase
      .from('posts')
      .select('id, title, series, persona, status, updated_at')
      .order('updated_at', { ascending: false })
      .limit(5),
  ]);

  const { count: totalCount } = await supabase
    .from('posts')
    .select('id', { count: 'exact', head: true });

  const { count: publishedCount } = await supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published');

  const { count: draftCount } = await supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'draft');

  const recent = posts ?? [];
  const greetingName = profile?.display_name ?? profile?.email?.split('@')[0] ?? '사용자';
  const isEmpty = (totalCount ?? 0) === 0;

  return (
    <div className="flex flex-col gap-8" style={{ maxWidth: 1080 }}>
      <div>
        <h1 className="text-[32px] font-bold m-0 mb-1 tracking-tight">
          안녕하세요, {greetingName}님 👋
        </h1>
        <p className="text-sm m-0" style={{ color: 'var(--text-secondary)' }}>
          오늘은 어떤 주제로 가볼까요?
        </p>
      </div>

      <QuickStart />

      <div>
        <div className="text-[18px] font-semibold mb-3">📊 이번 달 통계</div>
        <div className="grid grid-cols-4 gap-4">
          <StatCard num={String(totalCount ?? 0)} label="생성" />
          <StatCard num={String(publishedCount ?? 0)} label="게시" accent />
          <StatCard num={String(draftCount ?? 0)} label="초안" />
          <StatCard num="100%" label="안전 (레드 0)" accent />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[18px] font-semibold">🕐 최근 게시물</div>
          <Link
            href="/posts"
            className="text-[12px] px-2.5 py-1.5 rounded-md transition-colors no-underline"
            style={{ color: 'var(--text-secondary)' }}
          >
            전체 보기 →
          </Link>
        </div>

        {isEmpty ? (
          <div
            className="p-8 rounded-xl border flex flex-col items-center gap-3 text-center"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
          >
            <div className="text-[32px]">📝</div>
            <div className="text-[14px] font-semibold">아직 게시물이 없어요</div>
            <p className="text-[12px] m-0" style={{ color: 'var(--text-secondary)' }}>
              위 "＋ 새 게시물 만들기"로 시작하거나, 데모 데이터로 둘러보세요.
            </p>
            <div className="mt-2">
              <SeedDemoButton />
            </div>
          </div>
        ) : (
          <div
            className="rounded-xl border overflow-hidden"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
          >
            {recent.map((p, i) => (
              <Link
                key={p.id}
                href={`/posts/${p.id}`}
                className="flex gap-4 p-4 items-center transition-colors no-underline"
                style={{
                  borderBottom: i < recent.length - 1 ? '1px solid var(--border)' : 'none',
                  color: 'inherit',
                }}
              >
                <div
                  className="w-20 h-20 rounded-lg flex-shrink-0"
                  style={{
                    backgroundImage: `url(https://picsum.photos/seed/${p.id}/200/200)`,
                    backgroundSize: 'cover',
                  }}
                />
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <div className="font-semibold truncate">{p.title}</div>
                  <div className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                    {seriesShort(p.series)} · {personaLabel(p.persona)} · {relativeTime(p.updated_at)}
                  </div>
                </div>
                <StatusBadge status={p.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
