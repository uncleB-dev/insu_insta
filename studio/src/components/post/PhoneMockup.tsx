// Phone mockup uses SlideCanvas for the inner image area so that
// design choices (layout/blur/overlay/text_pos/accent/font_size/line_height)
// stay in sync with the main carousel preview and ZIP export.

import { SlideCanvas, type CanvasSlide } from './SlideCanvas';

export type PhoneMockupSlide = CanvasSlide;

const PHONE_IMAGE_SIZE = 272; // 304 - 8*2 (border) - 6*2 (padding)

export function PhoneMockup({
  slide,
  slideIdx,
  totalSlides,
  caption,
  hashtagPreview,
}: {
  slide: PhoneMockupSlide;
  slideIdx: number;
  totalSlides: number;
  caption: string;
  hashtagPreview?: string;
}) {
  return (
    <div
      className="relative"
      style={{
        width: 304,
        height: 624,
        border: '8px solid #1a1a1a',
        background: '#000',
        borderRadius: 36,
        padding: 6,
        boxShadow: 'var(--shadow-pop)',
      }}
    >
      <div
        className="absolute z-10"
        style={{
          top: 8,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 90,
          height: 22,
          background: '#000',
          borderRadius: 12,
        }}
      />

      <div
        className="w-full h-full flex flex-col overflow-hidden"
        style={{ background: '#000', borderRadius: 28 }}
      >
        <div className="flex items-center gap-2 px-3 pt-7 pb-2 text-white text-[13px]">
          <div
            className="w-7 h-7 rounded-full flex-shrink-0"
            style={{ background: 'linear-gradient(45deg,#feda75,#fa7e1e,#d62976)' }}
          />
          <div className="flex flex-col gap-0.5">
            <span className="text-[12px] font-semibold">uncleb_studio</span>
            <span className="text-[10px] text-[#aaa]">스폰서</span>
          </div>
          <div className="flex-1" />
          <span className="text-white">⋯</span>
        </div>

        {/* Slide canvas — same renderer as carousel + ZIP */}
        <div className="relative" style={{ width: PHONE_IMAGE_SIZE, height: PHONE_IMAGE_SIZE }}>
          <SlideCanvas slide={slide} size={PHONE_IMAGE_SIZE} />
          <div
            className="absolute bottom-2 right-2 text-[9px] text-white font-semibold px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(0,0,0,0.6)' }}
          >
            {slideIdx + 1}/{totalSlides}
          </div>
        </div>

        <div className="flex items-center gap-3.5 px-3 py-2.5 text-white text-lg">
          <span>♡</span>
          <span>💬</span>
          <span>📤</span>
          <div className="flex-1" />
          <span>🔖</span>
        </div>

        <div className="px-3 pb-3 text-white text-[11px] leading-snug">
          <b>uncleb_studio</b> {caption.slice(0, 80)}
          {caption.length > 80 ? '…' : ''}
          {hashtagPreview && (
            <div className="mt-1" style={{ color: '#7aaa7a' }}>
              {hashtagPreview}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
