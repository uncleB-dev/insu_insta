// Renders a single slide at any size — used for preview carousel and ZIP export.
// Single source of truth for slide visuals; respects per-slide font size + line height
// overrides with layout-based defaults as fallback.
//
// Design Ref: docs/01-plan/features/slide-templates.plan.md §7.2 — 9 distinct templates

import type { CSSProperties } from 'react';
import type { Principle, Speaker } from '@/lib/supabase/types';

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
  emphasis?: string[];
  /** null/undefined = use layout default */
  main_font_size?: number | null;
  sub_font_size?: number | null;
  line_height?: number | null;
  // slide-header-multi-msg: additional bubbles for dialogue layouts
  main2?: string | null;
  main3?: string | null;
  main4?: string | null;
  speaker?: Speaker;
  speaker2?: Speaker | null;
  speaker3?: Speaker | null;
  speaker4?: Speaker | null;
  // Per-post header (passed from parent)
  header_text?: string | null;
  header_image_url?: string | null;
  // manual-flow-redesign Module 4: inset image
  inset_image_url?: string | null;
  inset_image_pos?: string | null; // top_left | top_right | bottom_left | bottom_right | center
  inset_image_size?: string | null; // small | medium | large
};

// manual-flow-redesign Module 4: inset image size mapping (px at 540 reference)
const INSET_SIZE_PX: Record<string, number> = {
  small: 72,
  medium: 120,
  large: 168,
};

const ACCENT_MAP: Record<string, string> = {
  green: '#00FF88',
  yellow: '#FFD23F',
  red: '#FF4D6D',
  white: '#FFFFFF',
};

// ─── Layout slug normalization (backward compat with A~I) ───
const LEGACY_TO_SLUG: Record<string, string> = {
  A: 'msg_left',
  B: 'msg_right',
  C: 'qa_box',
  D: 'bold_title',
  E: 'bold_title',
  F: 'quote_card',
  G: 'bold_title',
  H: 'checklist',
  I: 'cta_card',
};

export function normalizeLayout(layout: string): string {
  if (!layout) return 'msg_left';
  return LEGACY_TO_SLUG[layout] ?? layout;
}

// Strip stray markdown markers (Gemini sometimes returns **bold**)
function stripMarkdown(text: string): string {
  if (!text) return text;
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1');
}

// ─── Layout-based defaults ──────────────────────────────────
export function defaultMainFontSize(layout: string): number {
  switch (normalizeLayout(layout)) {
    case 'msg_left':
    case 'msg_right':
      return 20;
    case 'qa_box':
      return 22;
    case 'bold_title':
      return 36;
    case 'data_card':
      return 18; // label only; the big number is auto-sized
    case 'quote_card':
      return 26;
    case 'checklist':
      return 18;
    case 'compare_box':
      return 16;
    case 'cta_card':
      return 26;
    default:
      return 28;
  }
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

/** Split lines for checklist / compare templates */
function splitLines(text: string, count: number): string[] {
  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length >= count) return lines.slice(0, count);
  // fallback: split by sentence punctuation
  const sentences = text.split(/[.!?。!?]+/).map((s) => s.trim()).filter(Boolean);
  if (sentences.length >= count) return sentences.slice(0, count);
  // last resort: pad with original full text
  return Array.from({ length: count }, (_, i) => lines[i] ?? sentences[i] ?? text);
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

  const scale = size / 540;
  const px = (n: number) => n * scale;
  const layout = normalizeLayout(slide.layout);

  const mainSize = effectiveMainFontSize(layout, slide.main_font_size);
  const subSize = effectiveSubFontSize(layout, slide.sub_font_size);
  const lh = effectiveLineHeight(layout, slide.line_height);
  const mainText = stripMarkdown(slide.main);
  const subText = stripMarkdown(slide.sub);
  const emphasis = (slide.emphasis ?? []).map(stripMarkdown);

  // ─── Render content based on layout ─────────────────────────
  const renderContent = () => {
    switch (layout) {
      case 'msg_left':
      case 'msg_right': {
        // slide-header-multi-msg: collect up to 4 bubbles
        type Bubble = { text: string; speaker: Speaker };
        const defaultSide: Speaker = layout === 'msg_left' ? 'niece' : 'uncle';
        const allBubbles: Bubble[] = [
          { text: mainText, speaker: slide.speaker ?? defaultSide },
          ...([
            { t: slide.main2, s: slide.speaker2 },
            { t: slide.main3, s: slide.speaker3 },
            { t: slide.main4, s: slide.speaker4 },
          ]
            .filter((b) => b.t && b.t.trim().length > 0)
            .map((b) => ({
              text: stripMarkdown(b.t!),
              speaker: (b.s ?? defaultSide) as Speaker,
            }))),
        ];

        return (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: px(8),
              width: '100%',
            }}
          >
            {allBubbles.map((b, i) => {
              const onRight = b.speaker === 'uncle';
              return (
                <div
                  key={i}
                  style={{
                    alignSelf: onRight ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    background: onRight ? '#FEE500' : '#fff',
                    color: '#000',
                    padding: `${px(12)}px ${px(16)}px`,
                    borderRadius: onRight
                      ? `${px(16)}px ${px(4)}px ${px(16)}px ${px(16)}px`
                      : `${px(4)}px ${px(16)}px ${px(16)}px ${px(16)}px`,
                    fontSize: px(mainSize),
                    fontWeight: 600,
                    lineHeight: lh,
                    wordBreak: 'keep-all',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {b.text}
                </div>
              );
            })}
          </div>
        );
      }

      case 'qa_box': {
        return (
          <div
            style={{
              background: 'rgba(0,0,0,0.6)',
              border: `${px(2)}px solid ${accent}`,
              borderRadius: px(12),
              padding: px(24),
            }}
          >
            <div
              style={{
                color: accent,
                fontSize: px(14),
                fontWeight: 700,
                marginBottom: px(8),
              }}
            >
              Q.
            </div>
            <div
              style={{
                fontSize: px(mainSize),
                fontWeight: 700,
                lineHeight: lh,
                wordBreak: 'keep-all',
                whiteSpace: 'pre-wrap',
                color: '#fff',
              }}
            >
              {mainText}
            </div>
          </div>
        );
      }

      case 'data_card': {
        // First emphasis item is the big number/highlight; main becomes the label
        const bigText = emphasis[0] ?? mainText.split(/\s/)[0];
        const labelText = emphasis[0]
          ? mainText
          : mainText.replace(bigText, '').trim() || mainText;
        return (
          <div
            style={{
              background: 'rgba(0,0,0,0.65)',
              border: `${px(2)}px solid ${accent}`,
              borderRadius: px(16),
              padding: `${px(36)}px ${px(28)}px`,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                color: accent,
                fontSize: px(72),
                fontWeight: 900,
                lineHeight: 1,
                marginBottom: px(12),
                wordBreak: 'keep-all',
                whiteSpace: 'pre-wrap',
              }}
            >
              {bigText}
            </div>
            <div
              style={{
                color: '#fff',
                fontSize: px(mainSize),
                fontWeight: 600,
                lineHeight: lh,
                wordBreak: 'keep-all',
                whiteSpace: 'pre-wrap',
              }}
            >
              {labelText}
            </div>
          </div>
        );
      }

      case 'quote_card': {
        return (
          <div
            style={{
              textAlign: 'center',
              padding: `0 ${px(16)}px`,
              color: '#fff',
            }}
          >
            <div
              style={{
                color: accent,
                fontSize: px(64),
                lineHeight: 0.6,
                marginBottom: px(8),
                fontWeight: 900,
              }}
            >
              "
            </div>
            <div
              style={{
                fontSize: px(mainSize),
                fontWeight: 700,
                lineHeight: lh,
                fontStyle: 'italic',
                wordBreak: 'keep-all',
                whiteSpace: 'pre-wrap',
                textShadow: `0 ${px(2)}px ${px(8)}px rgba(0,0,0,0.6)`,
              }}
            >
              {mainText}
            </div>
            <div
              style={{
                color: accent,
                fontSize: px(64),
                lineHeight: 0.6,
                marginTop: px(8),
                fontWeight: 900,
              }}
            >
              "
            </div>
          </div>
        );
      }

      case 'checklist': {
        const items =
          emphasis.length >= 2
            ? emphasis.slice(0, 5)
            : splitLines(mainText, 3);
        return (
          <div
            style={{
              background: 'rgba(0,0,0,0.55)',
              borderRadius: px(16),
              padding: px(28),
              display: 'flex',
              flexDirection: 'column',
              gap: px(14),
            }}
          >
            {items.map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: px(12),
                  color: '#fff',
                  fontSize: px(mainSize),
                  fontWeight: 600,
                  lineHeight: lh,
                  wordBreak: 'keep-all',
                  whiteSpace: 'pre-wrap',
                }}
              >
                <span
                  style={{
                    color: accent,
                    fontSize: px(mainSize + 4),
                    lineHeight: 1,
                    fontWeight: 900,
                    flexShrink: 0,
                  }}
                >
                  ✓
                </span>
                <span style={{ flex: 1 }}>{item}</span>
              </div>
            ))}
          </div>
        );
      }

      case 'compare_box': {
        const items =
          emphasis.length >= 2 ? emphasis.slice(0, 2) : splitLines(mainText, 2);
        const [left, right] = [items[0] ?? mainText, items[1] ?? ''];
        return (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `1fr ${px(40)}px 1fr`,
              gap: 0,
              alignItems: 'stretch',
              width: '100%',
            }}
          >
            <div
              style={{
                background: 'rgba(0,0,0,0.7)',
                border: `${px(2)}px solid #ff8a8a`,
                borderRadius: px(12),
                padding: px(20),
                textAlign: 'center',
                color: '#fff',
                fontSize: px(mainSize),
                fontWeight: 700,
                lineHeight: lh,
                wordBreak: 'keep-all',
                whiteSpace: 'pre-wrap',
              }}
            >
              <div
                style={{
                  color: '#ff8a8a',
                  fontSize: px(12),
                  fontWeight: 800,
                  marginBottom: px(8),
                }}
              >
                BEFORE
              </div>
              {left}
            </div>
            <div
              style={{
                color: accent,
                fontSize: px(28),
                fontWeight: 900,
                alignSelf: 'center',
                textAlign: 'center',
              }}
            >
              VS
            </div>
            <div
              style={{
                background: 'rgba(0,0,0,0.7)',
                border: `${px(2)}px solid ${accent}`,
                borderRadius: px(12),
                padding: px(20),
                textAlign: 'center',
                color: '#fff',
                fontSize: px(mainSize),
                fontWeight: 700,
                lineHeight: lh,
                wordBreak: 'keep-all',
                whiteSpace: 'pre-wrap',
              }}
            >
              <div
                style={{
                  color: accent,
                  fontSize: px(12),
                  fontWeight: 800,
                  marginBottom: px(8),
                }}
              >
                AFTER
              </div>
              {right || left}
            </div>
          </div>
        );
      }

      case 'cta_card': {
        return (
          <div
            style={{
              background: accent,
              color: '#0a0a0a',
              borderRadius: px(16),
              padding: `${px(28)}px ${px(24)}px`,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: px(mainSize),
                fontWeight: 900,
                lineHeight: lh,
                wordBreak: 'keep-all',
                whiteSpace: 'pre-wrap',
                marginBottom: subText ? px(10) : 0,
              }}
            >
              {mainText}
            </div>
            {subText && (
              <div
                style={{
                  fontSize: px(subSize),
                  fontWeight: 600,
                  lineHeight: lh,
                  wordBreak: 'keep-all',
                  whiteSpace: 'pre-wrap',
                  opacity: 0.85,
                }}
              >
                {subText}
              </div>
            )}
          </div>
        );
      }

      case 'bold_title':
      default: {
        return (
          <div
            style={{
              textAlign: 'center',
              fontSize: px(mainSize),
              fontWeight: 900,
              lineHeight: lh,
              color: '#fff',
              textShadow: `0 ${px(2)}px ${px(12)}px rgba(0,0,0,0.6)`,
              wordBreak: 'keep-all',
              whiteSpace: 'pre-wrap',
            }}
          >
            {mainText}
          </div>
        );
      }
    }
  };

  // sub-text below content (only for layouts that don't render sub inside)
  const showSubBelow =
    layout !== 'cta_card' && // cta_card renders sub inside the accent box
    !!subText;

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        fontFamily:
          "'GmarketSans', 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
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
        {renderContent()}
        {showSubBelow && (
          <div
            style={{
              marginTop: px(14),
              fontSize: px(subSize),
              lineHeight: lh,
              color: '#ddd',
              textAlign:
                layout === 'msg_left' || layout === 'msg_right' ? 'inherit' : 'center',
              textShadow: `0 ${px(1)}px ${px(6)}px rgba(0,0,0,0.6)`,
              wordBreak: 'keep-all',
              whiteSpace: 'pre-wrap',
            }}
          >
            {subText}
          </div>
        )}
      </div>

      {/* slide-header-multi-msg: 좌상단 브랜드 머릿말 */}
      {(slide.header_image_url || slide.header_text) && (
        <div
          className="absolute"
          style={{
            top: px(14),
            left: px(14),
            zIndex: 5,
            display: 'flex',
            alignItems: 'center',
            gap: px(6),
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            padding: `${px(5)}px ${px(10)}px`,
            borderRadius: px(8),
            maxWidth: '70%',
          }}
        >
          {slide.header_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={slide.header_image_url}
              alt=""
              style={{ height: px(22), width: 'auto', display: 'block' }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <span
              style={{
                color: 'rgba(255,255,255,0.92)',
                fontSize: px(11),
                fontWeight: 600,
                fontFamily: "'Pretendard', system-ui, sans-serif",
                letterSpacing: 0.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {slide.header_text}
            </span>
          )}
        </div>
      )}

      {/* manual-flow-redesign Module 4: inset image (small auxiliary illustration) */}
      {slide.inset_image_url && (() => {
        const sz = INSET_SIZE_PX[slide.inset_image_size ?? 'medium'] ?? 120;
        const pos = slide.inset_image_pos ?? 'bottom_right';
        const offset = px(20);
        const posStyle: CSSProperties = {
          position: 'absolute',
          width: px(sz),
          height: px(sz),
          objectFit: 'contain',
          zIndex: 4,
        };
        if (pos === 'top_left') {
          posStyle.top = offset;
          posStyle.left = offset;
        } else if (pos === 'top_right') {
          posStyle.top = offset;
          posStyle.right = offset;
        } else if (pos === 'bottom_left') {
          posStyle.bottom = offset;
          posStyle.left = offset;
        } else if (pos === 'center') {
          posStyle.top = '50%';
          posStyle.left = '50%';
          posStyle.transform = 'translate(-50%, -50%)';
        } else {
          // bottom_right (default)
          posStyle.bottom = offset;
          posStyle.right = offset;
        }
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={slide.inset_image_url}
            alt=""
            style={posStyle}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        );
      })()}

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
