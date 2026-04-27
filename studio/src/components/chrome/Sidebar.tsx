'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';

function SideItem({
  href,
  children,
  icon,
  active,
}: {
  href: string;
  children: React.ReactNode;
  icon: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium relative transition-colors',
        'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]',
        active && 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
      )}
    >
      {active && (
        <span
          className="absolute left-[-12px] top-2 bottom-2 w-1 rounded-r bg-[var(--brand-accent)]"
          aria-hidden
        />
      )}
      <span>{icon}</span>
      <span>{children}</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [adminOpen, setAdminOpen] = useState(pathname.startsWith('/admin'));

  const isActive = (p: string) => {
    if (p === '/') return pathname === '/';
    if (p === '/posts') return (pathname === '/posts' || pathname.startsWith('/posts/')) && !pathname.includes('/new');
    return pathname === p || pathname.startsWith(p + '/');
  };

  return (
    <aside
      className="flex flex-col gap-1 p-3 border-r border-[var(--border)] bg-[var(--bg-primary)] sticky top-0 h-screen overflow-y-auto"
      style={{ width: 240 }}
    >
      <Link
        href="/posts/new"
        className="flex items-center gap-2 px-3.5 py-3 rounded-[10px] mb-3 text-sm font-bold transition-colors"
        style={{ background: 'var(--brand-accent)', color: '#003320' }}
        onMouseOver={e => (e.currentTarget.style.background = 'var(--brand-accent-hover)')}
        onMouseOut={e => (e.currentTarget.style.background = 'var(--brand-accent)')}
      >
        <span className="text-base leading-none">＋</span>
        <span>새 게시물 만들기</span>
      </Link>

      <SideItem href="/" icon="📊" active={isActive('/')}>대시보드</SideItem>
      <SideItem href="/posts" icon="📝" active={isActive('/posts')}>히스토리</SideItem>
      <SideItem href="/library" icon="🖼️" active={isActive('/library')}>라이브러리</SideItem>

      <div className="h-px bg-[var(--border)] my-3" />

      <button
        onClick={() => setAdminOpen(o => !o)}
        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium w-full text-left
          text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors"
      >
        <span>⚙️</span>
        <span className="flex-1">Admin</span>
        <span className="text-[var(--text-muted)] text-[11px]">{adminOpen ? '▾' : '▸'}</span>
      </button>

      {adminOpen && (
        <div className="pl-3 flex flex-col gap-1">
          <SideItem href="/admin/prompts" icon="◦" active={isActive('/admin/prompts')}>프롬프트 관리</SideItem>
          <SideItem href="/admin/guardrails" icon="◦" active={isActive('/admin/guardrails')}>가드레일 룰</SideItem>
        </div>
      )}

      <div className="flex-1" />
      <div className="h-px bg-[var(--border)] my-2" />

      <Link
        href="/settings"
        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium
          text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors"
      >
        <span>👤</span>
        <span>설정</span>
      </Link>
    </aside>
  );
}
