'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type UserSummary = {
  email: string | null;
  name: string;
  avatar: string | null;
  initial: string;
};

function summarize(email: string | null, meta: Record<string, unknown> | undefined): UserSummary {
  const name =
    (meta?.['name'] as string | undefined) ??
    (meta?.['full_name'] as string | undefined) ??
    (email ? email.split('@')[0] : 'User');
  const avatar = (meta?.['avatar_url'] as string | undefined) ?? null;
  const initial = (name || 'U').slice(0, 1).toUpperCase();
  return { email, name, avatar, initial };
}

export function UserMenu() {
  const router = useRouter();
  const [user, setUser] = useState<UserSummary | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUser(summarize(user.email ?? null, user.user_metadata));
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(summarize(session.user.email ?? null, session.user.user_metadata));
      } else {
        setUser(null);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.replace('/login');
    router.refresh();
  };

  if (!user) {
    return (
      <div
        className="w-8 h-8 rounded-full"
        style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}
        aria-hidden
      />
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center rounded-full transition-opacity hover:opacity-80"
        style={{
          width: 32,
          height: 32,
          background: 'var(--brand-accent)',
          color: '#003320',
          border: 'none',
          overflow: 'hidden',
          cursor: 'pointer',
        }}
        aria-label="사용자 메뉴"
      >
        {user.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatar} alt="" width={32} height={32} style={{ objectFit: 'cover' }} />
        ) : (
          <span className="text-[12px] font-bold">{user.initial}</span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 rounded-lg overflow-hidden z-50"
          style={{
            width: 240,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-pop)',
          }}
        >
          <div
            className="px-3 py-3 border-b flex flex-col gap-0.5"
            style={{ borderColor: 'var(--border)' }}
          >
            <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
              {user.name}
            </span>
            {user.email && (
              <span
                className="text-[11px] truncate"
                style={{ color: 'var(--text-muted)' }}
              >
                {user.email}
              </span>
            )}
          </div>
          <button
            onClick={handleSignOut}
            className="w-full text-left px-3 py-2.5 text-[13px] transition-colors"
            style={{ color: 'var(--text-primary)', background: 'transparent', border: 'none' }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            ↪ 로그아웃
          </button>
        </div>
      )}
    </div>
  );
}
