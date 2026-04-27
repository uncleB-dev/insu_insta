'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/post/StatusBadge';
import { personaLabel, relativeTime, seriesShort, seriesLabel } from '@/lib/format';
import type { Persona, PostStatus, Series } from '@/lib/supabase/types';

export type PostRow = {
  id: string;
  title: string;
  series: Series;
  persona: Persona;
  status: PostStatus;
  updated_at: string;
};

const SERIES_KEYS: Series[] = ['A', 'B', 'C'];
const PERSONA_KEYS: Persona[] = ['30s_office', 'newbie', 'parent', 'newlywed'];

function PostCard({ post, onClick }: { post: PostRow; onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      className="rounded-xl border overflow-hidden cursor-pointer transition-all"
      style={{
        background: 'var(--bg-secondary)',
        borderColor: 'var(--border)',
        transform: hover ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hover ? 'var(--shadow-pop)' : 'none',
      }}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        className="relative"
        style={{
          aspectRatio: '1/1',
          backgroundImage: `url(https://picsum.photos/seed/${post.id}/400/400)`,
          backgroundSize: 'cover',
        }}
      >
        {hover && (
          <button
            className="absolute top-2 right-2 px-2.5 py-1.5 rounded-md text-[12px] font-semibold transition-colors"
            style={{
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-strong)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            ⋯
          </button>
        )}
      </div>
      <div className="flex flex-col gap-1.5 p-3.5">
        <div
          className="font-semibold text-[13px] leading-snug"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {post.title}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
            {seriesShort(post.series)} · {personaLabel(post.persona)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
            {relativeTime(post.updated_at)}
          </span>
          <StatusBadge status={post.status} />
        </div>
      </div>
    </div>
  );
}

export function PostsListClient({ posts }: { posts: PostRow[] }) {
  const router = useRouter();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filterSeries, setFilterSeries] = useState<'all' | Series>('all');
  const [filterPersona, setFilterPersona] = useState<'all' | Persona>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | PostStatus>('all');
  const [q, setQ] = useState('');

  const filtered = posts.filter((p) => {
    if (filterSeries !== 'all' && p.series !== filterSeries) return false;
    if (filterPersona !== 'all' && p.persona !== filterPersona) return false;
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (q && !p.title.includes(q)) return false;
    return true;
  });

  const selectCls = 'px-3 py-2 rounded-lg border text-[13px] outline-none transition-colors';
  const selectStyle = {
    background: 'var(--bg-tertiary)',
    borderColor: 'var(--border)',
    color: 'var(--text-primary)',
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[32px] font-bold m-0 mb-1 tracking-tight">📝 히스토리</h1>
          <p className="text-[12px] m-0" style={{ color: 'var(--text-secondary)' }}>
            총 {filtered.length}개의 게시물
          </p>
        </div>
        <button
          className="px-4 py-2.5 rounded-lg font-semibold text-[14px] transition-colors"
          style={{ background: 'var(--brand-accent)', color: '#003320' }}
          onClick={() => router.push('/posts/new')}
        >
          ＋ 새 게시물
        </button>
      </div>

      <div
        className="flex flex-col gap-3 p-6 rounded-xl border"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
      >
        <input
          className="w-full px-3 py-2.5 rounded-lg border text-[14px] outline-none transition-colors"
          style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          placeholder="🔍 제목으로 검색..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="flex gap-2 items-center flex-wrap">
          <select
            className={selectCls}
            style={selectStyle}
            value={filterSeries}
            onChange={(e) => setFilterSeries(e.target.value as 'all' | Series)}
          >
            <option value="all">시리즈: 전체</option>
            {SERIES_KEYS.map((k) => (
              <option key={k} value={k}>
                {seriesLabel(k)}
              </option>
            ))}
          </select>
          <select
            className={selectCls}
            style={selectStyle}
            value={filterPersona}
            onChange={(e) => setFilterPersona(e.target.value as 'all' | Persona)}
          >
            <option value="all">페르소나: 전체</option>
            {PERSONA_KEYS.map((k) => (
              <option key={k} value={k}>
                {personaLabel(k)}
              </option>
            ))}
          </select>
          <select
            className={selectCls}
            style={selectStyle}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | PostStatus)}
          >
            <option value="all">상태: 전체</option>
            <option value="draft">초안</option>
            <option value="scheduled">게시 예정</option>
            <option value="published">게시 완료</option>
          </select>
          <div className="flex-1" />
          <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
            보기:
          </span>
          {(['grid', 'list'] as const).map((v) => (
            <button
              key={v}
              className="px-2.5 py-1.5 rounded-md text-[12px] font-semibold transition-colors"
              style={{
                background: view === v ? 'var(--bg-tertiary)' : 'transparent',
                color: view === v ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: view === v ? '1px solid var(--border-strong)' : '1px solid transparent',
              }}
              onClick={() => setView(v)}
            >
              {v === 'grid' ? '⊞ 그리드' : '☰ 리스트'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div
          className="p-12 rounded-xl border text-center"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
        >
          <div className="text-[40px] mb-3">📭</div>
          <div className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
            조건에 맞는 게시물이 없어요
          </div>
        </div>
      ) : view === 'grid' ? (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {filtered.map((p) => (
            <PostCard key={p.id} post={p} onClick={() => router.push(`/posts/${p.id}`)} />
          ))}
        </div>
      ) : (
        <div
          className="rounded-xl border overflow-hidden"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
        >
          {filtered.map((p, i) => (
            <div
              key={p.id}
              className="flex gap-4 p-4 items-center cursor-pointer transition-colors"
              style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}
              onClick={() => router.push(`/posts/${p.id}`)}
              onMouseOver={(e) => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
              onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div
                className="w-12 h-12 rounded-md flex-shrink-0"
                style={{
                  backgroundImage: `url(https://picsum.photos/seed/${p.id}/200/200)`,
                  backgroundSize: 'cover',
                }}
              />
              <div className="flex-1 font-semibold">{p.title}</div>
              <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                {seriesShort(p.series)}
              </span>
              <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                {personaLabel(p.persona)}
              </span>
              <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                {relativeTime(p.updated_at)}
              </span>
              <StatusBadge status={p.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
