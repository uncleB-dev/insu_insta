'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { POSTS, SERIES, PERSONAS } from '@/lib/mock';
import { StatusBadge } from '@/components/post/StatusBadge';

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

export default function DashboardPage() {
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const recent = POSTS.slice(0, 5);

  const handleGenerate = () => {
    router.push('/posts/new');
  };

  return (
    <div className="flex flex-col gap-8" style={{ maxWidth: 1080 }}>
      <div>
        <h1 className="text-[32px] font-bold m-0 mb-1 tracking-tight">안녕하세요, BEN님 👋</h1>
        <p className="text-sm m-0" style={{ color: 'var(--text-secondary)' }}>
          오늘은 어떤 주제로 가볼까요?
        </p>
      </div>

      {/* 퀵 시작 */}
      <div
        className="p-8 rounded-xl border"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
      >
        <div className="text-[18px] font-semibold mb-1">＋ 새 게시물 만들기</div>
        <p className="text-[12px] mb-4 m-0" style={{ color: 'var(--text-secondary)' }}>
          주제 한 줄을 입력하면 1단계 입력 화면으로 이어져요
        </p>
        <div className="flex gap-2">
          <input
            className="flex-1 px-3 py-2.5 rounded-lg border text-[14px] outline-none transition-colors"
            style={{
              background: 'var(--bg-tertiary)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
            placeholder="예: 암치료비가 비싸다는데 얼마나?"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && topic.trim() && handleGenerate()}
            onFocus={e => (e.target.style.borderColor = 'var(--brand-accent)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
          />
          <button
            className="px-4 py-2.5 rounded-lg font-semibold text-[14px] transition-colors disabled:opacity-40"
            style={{ background: 'var(--brand-accent)', color: '#003320' }}
            disabled={!topic.trim()}
            onClick={handleGenerate}
            onMouseOver={e => { if (topic.trim()) e.currentTarget.style.background = 'var(--brand-accent-hover)'; }}
            onMouseOut={e => (e.currentTarget.style.background = 'var(--brand-accent)')}
          >
            생성 →
          </button>
        </div>
      </div>

      {/* 통계 */}
      <div>
        <div className="text-[18px] font-semibold mb-3">📊 이번 달 통계</div>
        <div className="grid grid-cols-4 gap-4">
          <StatCard num="12" label="생성" />
          <StatCard num="8" label="게시" accent />
          <StatCard num="4" label="초안" />
          <StatCard num="100%" label="안전 (레드 0)" accent />
        </div>
      </div>

      {/* 최근 게시물 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[18px] font-semibold">🕐 최근 게시물</div>
          <button
            className="text-[12px] px-2.5 py-1.5 rounded-md transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onClick={() => router.push('/posts')}
            onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            전체 보기 →
          </button>
        </div>
        <div
          className="rounded-xl border overflow-hidden"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
        >
          {recent.map((p, i) => (
            <div
              key={p.id}
              className="flex gap-4 p-4 items-center cursor-pointer transition-colors"
              style={{
                borderBottom: i < recent.length - 1 ? '1px solid var(--border)' : 'none',
              }}
              onClick={() => router.push(`/posts/${p.id}`)}
              onMouseOver={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
              onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
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
                  {SERIES[p.series].split(' · ')[0]} · {PERSONAS[p.persona]} · {p.updated}
                </div>
              </div>
              <StatusBadge status={p.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
