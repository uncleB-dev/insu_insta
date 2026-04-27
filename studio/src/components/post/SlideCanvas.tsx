// Renders a single slide at any size — used for preview carousel and ZIP export.
// Pixel-equivalent to DesignEditorClient's SlidePreview but parameterised for size.

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
};

const ACCENT_MAP: Record<string, string> = {
  green: '#00FF88',
  yellow: '#FFD23F',
  red: '#FF4D6D',
  white: '#FFFFFF',
};

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

  // Scale paddings/text proportionally to size for ZIP capture at 1080
  const scale = size / 540;
  const px = (n: number) => n * scale;

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
              fontSize: px(20),
              fontWeight: 600,
              lineHeight: 1.4,
            }}
          >
            {slide.main}
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
            <div style={{ fontSize: px(22), fontWeight: 700, lineHeight: 1.35 }}>
              {slide.main}
            </div>
          </div>
        ) : (
          <div
            style={{
              textAlign: 'center',
              fontSize: px(28),
              fontWeight: 900,
              lineHeight: 1.2,
              textShadow: `0 ${px(2)}px ${px(12)}px rgba(0,0,0,0.6)`,
            }}
          >
            {slide.main}
          </div>
        )}
        {slide.sub && (
          <div
            style={{
              marginTop: px(14),
              fontSize: px(13),
              lineHeight: 1.35,
              color: '#ddd',
              textAlign: ['A', 'B'].includes(slide.layout) ? 'inherit' : 'center',
              textShadow: `0 ${px(1)}px ${px(6)}px rgba(0,0,0,0.6)`,
            }}
          >
            {slide.sub}
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
