'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function QuickStart() {
  const router = useRouter();
  const [topic, setTopic] = useState('');

  const go = () => {
    const trimmed = topic.trim();
    if (!trimmed) return;
    router.push(`/posts/new?topic=${encodeURIComponent(trimmed)}`);
  };

  return (
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
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && go()}
          onFocus={(e) => (e.target.style.borderColor = 'var(--brand-accent)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
        />
        <button
          className="px-4 py-2.5 rounded-lg font-semibold text-[14px] transition-colors disabled:opacity-40"
          style={{ background: 'var(--brand-accent)', color: '#003320' }}
          disabled={!topic.trim()}
          onClick={go}
          onMouseOver={(e) => {
            if (topic.trim()) e.currentTarget.style.background = 'var(--brand-accent-hover)';
          }}
          onMouseOut={(e) => (e.currentTarget.style.background = 'var(--brand-accent)')}
        >
          생성 →
        </button>
      </div>
    </div>
  );
}
