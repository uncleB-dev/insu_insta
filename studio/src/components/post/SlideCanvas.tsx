// Renders a single slide at any size — used for preview carousel and ZIP export.
// Single source of truth for slide visuals; respects per-slide font size + line height
// overrides with layout-based defaults as fallback.
//
// Design Ref: docs/01-plan/features/design-font-size.plan.md §7.2

import type { Principle } from '@/lib/supabase/types';

export type CanvasSlide = {
  principle: Principle;
  main: string;
  sub: string;
  layout: string;
  blur: number;
  overlay: number;
  text_pos: string;
  accent_color: string;
  bg_src: string;
  ord: number;
  /** null/undefined = use layout default */
  main_font_size?: number | null;
  /** null/undefined = use layout default */
  sub_font_size?: number | null;
  /** null/undefined = use layout default (1.4) */
  line_height?: number | null;
};

const ACCENT_MAP: Record<string, string> = {
  green: '#00FF88',
  yellow: '#FFD23F',
  red: '#FF4D6D',
  white: '#FFFFFF',
};

// Gemini sometimes returns **bold** markdown markers in text.
// We use the `emphasis` array for true bolding, so strip the markers from display.
function stripMarkdown(text: string): string {
  if (!text) return text;
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1') // **bold**
    .replace(/\*(.+?)\*/g, '$1')       // *italic*
    .replace(/__(.+?)__/g, '$1')       // __bold__
    .replace(/_(.+?)_/g, '$1');         // _italic_
}

// ─── Layout-based defaults ──────────────────────────────────
// Plan SC-8: backward compat — null fields render identically to pre-migration.
export function defaultMainFontSize(layout: string): number {
  if (layout === 'A' || layout === 'B') return 20;
  if (layout === 'C') return 22;
  return 28; // D~I
}

export function defaultSubFontSize(_layout: string): number {
  return 13;
}

export function defaultLineHeight(_layout: string): number {
  return 1.4;
}

export function effectiveMainFontSize(
  layout: string,
  override?: number | null,
): number {
  return override ?? defaultMainFontSize(layout);
}

export function effectiveSubFontSize(
  layout: string,
  override?: number | null,
): number {
  return override ?? defaultSubFontSize(layout);
}

export function effectiveLineHeight(
  layout: string,
  override?: number | null,
): number {
  return override ?? defaultLineHeight(layout);
}

export function SlideCanvas({
  slide,
  size = 540,
  showIndex,
  totalSlides,
}: {
  slide: CanvasSlide;
  size?: number;
  showIndex?: boolean;
  totalSlides?: number;
}) {
  const accent = ACCENT_MAP[slide.accent_color] || '#00FF88';
  const justifyContent =
    slide.text_pos === 'top' ? 'flex-start' : slide.text_pos === 'bot' ? 'flex-end' : 'center';
  const bg =
    slide.bg_src || `https://picsum.photos/seed/insu${slide.ord + 10}/800/800`;

  // Plan SC-7: scale paddings/text proportionally to size for ZIP capture at 1080
  const scale = size / 540;
  const px = (n: number) => n * scale;

  // Effective font sizes (override with fallback to layout default)
  const mainSize = effectiveMainFontSize(slide.layout, slide.main_font_size);
  const subSize = effectiveSubFontSize(slide.layout, slide.sub_font_size);
  const lh = effectiveLineHeight(slide.layout, slide.line_height);

  // Strip stray markdown markers from AI-generated text
  const mainText = stripMarkdown(slide.main);
  const subText = stripMarkdown(slide.sub);

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `rgba(0,0,0,${slide.overlay / 100})`,
          backdropFilter: `blur(${slide.blur * scale}px)`,
          WebkitBackdropFilter: `blur(${slide.blur * scale}px)`,
        }}
      />
      <div
        className="absolute inset-0 flex flex-col"
        style={{ justifyContent, color: '#fff', padding: px(32) }}
      >
        {slide.layout === 'A' || slide.layout === 'B' ? (
          <div
            style={{
              alignSelf: slide.layout === 'A' ? 'flex-start' : 'flex-end',
              maxWidth: '80%',
              background: slide.layout === 'A' ? '#fff' : '#FEE500',
              color: '#000',
              padding: `${px(14)}px ${px(18)}px`,
              borderRadius:
                slide.layout === 'A'
                  ? `${px(4)}px ${px(16)}px ${px(16)}px ${px(16)}px`
                  : `${px(16)}px ${px(4)}px ${px(16)}px ${px(16)}px`,
              fontSize: px(mainSize),
              fontWeight: 600,
              lineHeight: lh,
              wordBreak: 'keep-all',
            }}
          >
            {mainText}
          </div>
        ) : slide.layout === 'C' ? (
          <div
            style={{
              background: 'rgba(0,0,0,0.6)',
              border: `${px(2)}px solid ${accent}`,
              borderRadius: px(12),
              padding: px(24),
            }}
          >
            <div
              style={{ color: accent, fontSize: px(14), fontWeight: 700, marginBottom: px(8) }}
            >
              Q.
            </div>
            <div
              style={{ fontSize: px(mainSize), fontWeight: 700, lineHeight: lh, wordBreak: 'keep-all' }}
            >
              {mainText}
            </div>
          </div>
        ) : (
          <div
            style={{
              textAlign: 'center',
              fontSize: px(mainSize),
              fontWeight: 900,
              lineHeight: lh,
              textShadow: `0 ${px(2)}px ${px(12)}px rgba(0,0,0,0.6)`,
              wordBreak: 'keep-all',
            }}
          >
            {mainText}
          </div>
        )}
        {subText && (
          <div
            style={{
              marginTop: px(14),
              fontSize: px(subSize),
              lineHeight: lh,
              color: '#ddd',
              textAlign: ['A', 'B'].includes(slide.layout) ? 'inherit' : 'center',
              textShadow: `0 ${px(1)}px ${px(6)}px rgba(0,0,0,0.6)`,
              wordBreak: 'keep-all',
            }}
          >
            {subText}
          </div>
        )}
      </div>

      {showIndex && totalSlides && (
        <div
          className="absolute"
          style={{
            bottom: px(16),
            right: px(16),
            background: 'rgba(0,0,0,0.6)',
            color: '#fff',
            fontSize: px(11),
            fontWeight: 600,
            padding: `${px(4)}px ${px(10)}px`,
            borderRadius: px(12),
          }}
        >
          {slide.ord} / {totalSlides}
        </div>
      )}
    </div>
  );
}
