import { PRINCIPLES } from '@/lib/principles';
import type { EditorSlide } from '@/lib/editor';
import { PrincipleBadge } from './PrincipleBadge';
import { cn } from '@/lib/utils';

export function SlideCard({
  index,
  slide,
  selected,
  onClick,
}: {
  index: number;
  slide: EditorSlide;
  selected: boolean;
  onClick: () => void;
}) {
  const p = PRINCIPLES[slide.principle];
  const hasRed = slide.guards.some(g => g.kind === 'red');
  const hasWarn = slide.guards.length > 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex gap-2.5 p-3 rounded-[10px] cursor-pointer relative transition-colors items-stretch',
        'bg-[var(--bg-secondary)] border',
        selected
          ? 'border-[var(--brand-accent)] bg-[#1a1a1a]'
          : 'border-[var(--border)] hover:border-[var(--border-strong)]'
      )}
    >
      {/* 드래그 핸들 */}
      <span className="text-[var(--text-muted)] text-base self-center cursor-grab px-0.5">⋮⋮</span>

      {/* 컬러바 */}
      <div
        className="w-1 rounded-full flex-shrink-0"
        style={{ background: p.color }}
      />

      {/* 내용 */}
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-[var(--text-muted)]">
            {String(index + 1).padStart(2, '0')}
          </span>
          <PrincipleBadge principle={slide.principle} />
        </div>
        <p className="text-[13px] text-[var(--text-primary)] overflow-hidden text-ellipsis line-clamp-2 m-0">
          {slide.main}
        </p>
      </div>

      {/* 가드레일 경고 */}
      {hasWarn && (
        <span className="absolute top-2 right-2 text-[12px]">
          {hasRed ? '🔴' : '🟡'}
        </span>
      )}
    </div>
  );
}
