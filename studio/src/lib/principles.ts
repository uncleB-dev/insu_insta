export type PrincipleKey = 'hook' | 'problem' | 'solution' | 'doubt' | 'scarcity' | 'cta';

export const PRINCIPLES = {
  hook:     { ko: '후킹',     color: 'var(--p-hook)',     emoji: '🟦' },
  problem:  { ko: '문제점',   color: 'var(--p-problem)',  emoji: '🟧' },
  solution: { ko: '해결책',   color: 'var(--p-solution)', emoji: '🟩' },
  doubt:    { ko: '의심제거', color: 'var(--p-doubt)',    emoji: '🟪' },
  scarcity: { ko: '희소성',   color: 'var(--p-scarcity)', emoji: '🟥' },
  cta:      { ko: 'CTA',      color: 'var(--p-cta)',      emoji: '🟨' },
} as const satisfies Record<PrincipleKey, { ko: string; color: string; emoji: string }>;
