'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { UserMenu } from './UserMenu';

const STEPS = [
  { n: '1️⃣', label: '입력',     key: 'input' },
  { n: '2️⃣', label: '스크립트', key: 'script' },
  { n: '3️⃣', label: '디자인',   key: 'design' },
  { n: '4️⃣', label: '미리보기', key: 'preview' },
] as const;

type StepKey = (typeof STEPS)[number]['key'];

function resolveStep(pathname: string): StepKey | null {
  if (/^\/posts\/new$/.test(pathname)) return 'input';
  if (/^\/posts\/[^/]+\/script$/.test(pathname)) return 'script';
  if (/^\/posts\/[^/]+\/design$/.test(pathname)) return 'design';
  if (/^\/posts\/[^/]+\/preview$/.test(pathname)) return 'preview';
  return null;
}

export function TopBar({
  postTitle,
  saveStatus = 'saved',
}: {
  postTitle?: string;
  saveStatus?: 'saved' | 'saving';
}) {
  const pathname = usePathname();
  const currentStep = resolveStep(pathname);
  const showStepper = currentStep !== null;

  return (
    <header
      className="flex items-center justify-between px-6 border-b border-[var(--border)] bg-[var(--bg-primary)] sticky top-0 z-30"
      style={{ height: 56, gridArea: 'topbar' }}
    >
      {/* 로고 */}
      <Link href="/" className="flex items-center gap-3 no-underline">
        <span className="text-lg">🟢</span>
        <span
          className="text-lg font-bold tracking-tight"
          style={{ color: 'var(--brand-accent)' }}
        >
          보험삼촌 BEN&apos;s Studio
        </span>
      </Link>

      {/* 단계 인디케이터 */}
      {showStepper && (
        <div className="flex items-center gap-4">
          {postTitle && (
            <span className="text-[13px] text-[var(--text-secondary)]">{postTitle}</span>
          )}
          <div className="flex items-center gap-2 text-[13px] text-[var(--text-muted)]">
            {STEPS.map((s, i) => (
              <span key={s.key} className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex items-center gap-1.5',
                    s.key === currentStep && 'font-semibold'
                  )}
                  style={{ color: s.key === currentStep ? 'var(--brand-accent)' : undefined }}
                >
                  <span>{s.n}</span>
                  <span>{s.label}</span>
                </span>
                {i < STEPS.length - 1 && (
                  <span className="opacity-50">→</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 우측 */}
      <div className="flex items-center gap-3">
        <span
          className="text-[12px]"
          style={{ color: saveStatus === 'saving' ? 'var(--status-yellow)' : 'var(--text-muted)' }}
        >
          {saveStatus === 'saving' ? '저장 중...' : '저장됨 ✓'}
        </span>
        <UserMenu />
      </div>
    </header>
  );
}
