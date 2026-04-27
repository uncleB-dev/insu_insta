'use client';

import { useState } from 'react';
import type { GuardHitRaw } from '@/lib/mock';

export function GuardedText({
  text,
  guards,
  onReplace,
}: {
  text: string;
  guards: GuardHitRaw[];
  onReplace?: (oldWord: string, newWord: string) => void;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!guards || guards.length === 0) return <>{text}</>;

  // Split text by guard words, preserving segments
  type Part = string | { g: GuardHitRaw; w: string; idx: number };
  let parts: Part[] = [text];
  let guardIdx = 0;

  guards.forEach(g => {
    const next: Part[] = [];
    parts.forEach(seg => {
      if (typeof seg !== 'string') { next.push(seg); return; }
      const i = seg.indexOf(g.word);
      if (i === -1) { next.push(seg); return; }
      if (i > 0) next.push(seg.slice(0, i));
      next.push({ g, w: seg.substr(i, g.word.length), idx: guardIdx++ });
      next.push(seg.slice(i + g.word.length));
    });
    parts = next;
  });

  return (
    <>
      {parts.map((p, i) => {
        if (typeof p === 'string') return <span key={i}>{p}</span>;
        const cls = p.g.kind === 'red' ? 'guard-red' : 'guard-yellow';
        return (
          <span key={i} className="relative inline-block">
            <span
              className={cls}
              onMouseEnter={() => setHoveredIdx(p.idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => onReplace?.(p.g.word, p.g.suggest)}
              title={p.g.suggest ? `→ ${p.g.suggest}` : undefined}
            >
              {p.w}
            </span>
            {hoveredIdx === p.idx && p.g.suggest && (
              <span
                className="absolute left-0 top-full mt-1 px-2 py-1 rounded-md text-[11px] whitespace-nowrap z-50 pointer-events-none"
                style={{
                  background: '#000',
                  border: '1px solid var(--brand-accent)',
                  color: 'var(--brand-accent)',
                }}
              >
                → {p.g.suggest}
              </span>
            )}
          </span>
        );
      })}
    </>
  );
}
