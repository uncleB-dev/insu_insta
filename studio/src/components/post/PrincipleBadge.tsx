import { PRINCIPLES, type PrincipleKey } from '@/lib/principles';
import { cn } from '@/lib/utils';

const BG_ALPHA: Record<PrincipleKey, string> = {
  hook:     'rgba(77,166,255,0.1)',
  problem:  'rgba(255,138,61,0.1)',
  solution: 'rgba(0,255,136,0.1)',
  doubt:    'rgba(181,123,255,0.1)',
  scarcity: 'rgba(255,77,109,0.1)',
  cta:      'rgba(255,210,63,0.1)',
};

const BORDER_ALPHA: Record<PrincipleKey, string> = {
  hook:     'rgba(77,166,255,0.4)',
  problem:  'rgba(255,138,61,0.4)',
  solution: 'rgba(0,255,136,0.4)',
  doubt:    'rgba(181,123,255,0.4)',
  scarcity: 'rgba(255,77,109,0.4)',
  cta:      'rgba(255,210,63,0.4)',
};

export function PrincipleBadge({ principle, className }: { principle: PrincipleKey; className?: string }) {
  const p = PRINCIPLES[principle];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border',
        className
      )}
      style={{
        color: p.color,
        background: BG_ALPHA[principle],
        borderColor: BORDER_ALPHA[principle],
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
      {p.ko}
    </span>
  );
}
