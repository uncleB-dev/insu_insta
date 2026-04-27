import type { Slide } from '@/lib/mock';

export function PhoneMockup({
  slide,
  slideIdx,
  totalSlides,
  caption,
}: {
  slide: Slide;
  slideIdx: number;
  totalSlides: number;
  caption: string;
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
      {/* 다이나믹 아일랜드 */}
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

      {/* 화면 */}
      <div
        className="w-full h-full flex flex-col overflow-hidden"
        style={{ background: '#000', borderRadius: 28 }}
      >
        {/* 인스타 헤더 */}
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

        {/* 슬라이드 이미지 */}
        <div
          className="relative"
          style={{
            aspectRatio: '1/1',
            backgroundImage: `url(https://picsum.photos/seed/insu${slideIdx + 10}/600/600)`,
            backgroundSize: 'cover',
          }}
        >
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.45)' }} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div
              className="text-[14px] font-semibold leading-snug max-w-[90%]"
              style={{
                background: '#fff',
                color: '#000',
                padding: '10px 14px',
                borderRadius: '4px 12px 12px 12px',
              }}
            >
              {slide.main}
            </div>
          </div>
          <div
            className="absolute bottom-2 right-2 text-[9px] text-white font-semibold px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(0,0,0,0.6)' }}
          >
            {slideIdx + 1}/{totalSlides}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-3.5 px-3 py-2.5 text-white text-lg">
          <span>♡</span>
          <span>💬</span>
          <span>📤</span>
          <div className="flex-1" />
          <span>🔖</span>
        </div>

        {/* 캡션 */}
        <div className="px-3 pb-3 text-white text-[11px] leading-snug">
          <b>uncleb_studio</b> {caption.slice(0, 80)}...
          <div className="mt-1" style={{ color: '#7aaa7a' }}>#보험삼촌 #암보험 #비급여...</div>
        </div>
      </div>
    </div>
  );
}
