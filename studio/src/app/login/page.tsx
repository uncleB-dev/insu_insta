'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('ben@unclebstudio.com');
  const [pw, setPw] = useState('');

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-8 p-10"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* 로고 */}
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="text-[42px]">🟢</span>
        <h1
          className="text-[32px] font-bold tracking-tight m-0"
          style={{ color: 'var(--brand-accent)' }}
        >
          보험삼촌 BEN&apos;s Studio
        </h1>
        <p className="text-sm m-0" style={{ color: 'var(--text-secondary)' }}>
          한 줄 주제로 카드뉴스 9컷이 나오는 인스타 스튜디오
        </p>
      </div>

      {/* 로그인 카드 */}
      <div
        className="flex flex-col gap-4 p-8 rounded-xl border"
        style={{ width: 400, background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
      >
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            이메일
          </label>
          <input
            className="w-full px-3 py-2.5 rounded-lg border text-[14px] outline-none transition-colors"
            style={{
              background: 'var(--bg-tertiary)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
            value={email}
            onChange={e => setEmail(e.target.value)}
            type="email"
            onFocus={e => (e.target.style.borderColor = 'var(--brand-accent)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            비밀번호
          </label>
          <input
            className="w-full px-3 py-2.5 rounded-lg border text-[14px] outline-none transition-colors"
            style={{
              background: 'var(--bg-tertiary)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
            value={pw}
            onChange={e => setPw(e.target.value)}
            type="password"
            placeholder="••••••••"
            onFocus={e => (e.target.style.borderColor = 'var(--brand-accent)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>
        <button
          className="w-full py-3 rounded-lg font-semibold text-[14px] mt-2 transition-colors"
          style={{ background: 'var(--brand-accent)', color: '#003320' }}
          onClick={() => router.push('/')}
          onMouseOver={e => (e.currentTarget.style.background = 'var(--brand-accent-hover)')}
          onMouseOut={e => (e.currentTarget.style.background = 'var(--brand-accent)')}
        >
          로그인 →
        </button>
      </div>

      <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
        © 2026 unclebstudio · Phase 1 · 본인 전용
      </p>
    </div>
  );
}
