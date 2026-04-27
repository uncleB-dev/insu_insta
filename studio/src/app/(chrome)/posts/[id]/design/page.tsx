'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { SCRIPT_SLIDES } from '@/lib/mock';
import { PRINCIPLES } from '@/lib/principles';
import type { PrincipleKey } from '@/lib/principles';

const LAYOUTS = [
  { id: 'A', name: '카톡 좌측', best: ['hook', 'problem', 'doubt'] as PrincipleKey[] },
  { id: 'B', name: '카톡 우측', best: ['problem', 'doubt'] as PrincipleKey[] },
  { id: 'C', name: 'Q&A 박스',  best: ['solution', 'doubt'] as PrincipleKey[] },
  { id: 'D', name: '구조도',    best: ['solution'] as PrincipleKey[] },
  { id: 'E', name: '풀블리드',  best: ['hook', 'scarcity'] as PrincipleKey[] },
  { id: 'F', name: '인용 카드', best: ['scarcity', 'cta'] as PrincipleKey[] },
  { id: 'G', name: '단순 타이틀', best: ['hook'] as PrincipleKey[] },
  { id: 'H', name: '리스트 카드', best: ['solution'] as PrincipleKey[] },
  { id: 'I', name: 'CTA 마감',   best: ['cta'] as PrincipleKey[] },
];

const ACCENT_MAP: Record<string, string> = {
  green:  '#00FF88',
  yellow: '#FFD23F',
  red:    '#FF4D6D',
  white:  '#FFFFFF',
};

function SlidePreview({
  slide,
  layout,
  blur,
  overlay,
  textPos,
  accent,
  photoSrc,
  slideIdx,
  total,
}: {
  slide: typeof SCRIPT_SLIDES[0];
  layout: string;
  blur: number;
  overlay: number;
  textPos: string;
  accent: string;
  photoSrc: string;
  slideIdx: number;
  total: number;
}) {
  const accentColor = ACCENT_MAP[accent] || '#00FF88';
  const justifyContent = textPos === 'top' ? 'flex-start' : textPos === 'bot' ? 'flex-end' : 'center';

  return (
    <div
      className="relative overflow-hidden rounded-lg"
      style={{
        aspectRatio: '1/1',
        width: 'min(540px, 100%)',
        backgroundImage: `url(${photoSrc})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* 오버레이 */}
      <div
        className="absolute inset-0"
        style={{
          background: `rgba(0,0,0,${overlay / 100})`,
          backdropFilter: `blur(${blur}px)`,
          WebkitBackdropFilter: `blur(${blur}px)`,
        }}
      />

      {/* 텍스트 */}
      <div
        className="absolute inset-0 flex flex-col p-8"
        style={{ justifyContent, color: '#fff' }}
      >
        {layout === 'A' || layout === 'B' ? (
          <div
            style={{
              alignSelf: layout === 'A' ? 'flex-start' : 'flex-end',
              maxWidth: '80%',
              background: layout === 'A' ? '#fff' : '#FEE500',
              color: '#000',
              padding: '14px 18px',
              borderRadius: layout === 'A' ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
              fontSize: 20,
              fontWeight: 600,
              lineHeight: 1.4,
            }}
          >
            {slide.main}
          </div>
        ) : layout === 'C' ? (
          <div
            className="rounded-xl p-6"
            style={{ background: 'rgba(0,0,0,0.6)', border: `2px solid ${accentColor}` }}
          >
            <div className="text-[14px] font-bold mb-2" style={{ color: accentColor }}>Q.</div>
            <div className="text-[22px] font-bold leading-snug">{slide.main}</div>
          </div>
        ) : (
          <div
            className="text-center text-[28px] font-black leading-tight"
            style={{ textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}
          >
            {slide.main}
          </div>
        )}
        {slide.sub && (
          <div
            className="mt-3.5 text-[13px] leading-snug"
            style={{
              color: '#ddd',
              textAlign: ['A', 'B'].includes(layout) ? 'inherit' : 'center',
              textShadow: '0 1px 6px rgba(0,0,0,0.6)',
            }}
          >
            {slide.sub}
          </div>
        )}
      </div>

      {/* 슬라이드 번호 */}
      <div
        className="absolute bottom-4 right-4 text-[11px] font-semibold px-2.5 py-1 rounded-xl"
        style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}
      >
        {slideIdx + 1} / {total}
      </div>
    </div>
  );
}

export default function DesignPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const slides = SCRIPT_SLIDES;

  const [selIdx, setSelIdx] = useState(2);
  const [layout, setLayout] = useState('A');
  const [blur, setBlur] = useState(8);
  const [overlay, setOverlay] = useState(50);
  const [applyAll, setApplyAll] = useState(false);
  const [textPos, setTextPos] = useState('mid');
  const [accent, setAccent] = useState('green');
  const photoSrc = `https://picsum.photos/seed/insu${selIdx + 10}/800/800`;

  const sel = slides[selIdx];

  return (
    <div
      className="flex flex-col gap-4"
      style={{ height: 'calc(100vh - 56px - 64px)', minHeight: 0 }}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[24px]">3️⃣</span>
          <h1 className="text-[24px] font-bold m-0">이미지 합성</h1>
        </div>
        <div className="flex gap-2">
          <button
            className="px-4 py-2.5 rounded-lg font-semibold text-[14px] transition-colors"
            style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid transparent' }}
            onClick={() => router.push(`/posts/${params.id}/script`)}
            onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            ← 스크립트로
          </button>
          <button
            className="px-4 py-2.5 rounded-lg font-semibold text-[14px] transition-colors"
            style={{ background: 'var(--brand-accent)', color: '#003320' }}
            onClick={() => router.push(`/posts/${params.id}/preview`)}
            onMouseOver={e => (e.currentTarget.style.background = 'var(--brand-accent-hover)')}
            onMouseOut={e => (e.currentTarget.style.background = 'var(--brand-accent)')}
          >
            미리보기 →
          </button>
        </div>
      </div>

      {/* 3컬럼 */}
      <div className="grid gap-4 flex-1 min-h-0" style={{ gridTemplateColumns: '200px 1fr 320px' }}>
        {/* 좌: 슬라이드 썸네일 */}
        <div className="flex flex-col gap-2 overflow-y-auto">
          {slides.map((s, i) => {
            const p = PRINCIPLES[s.principle];
            return (
              <div
                key={s.id}
                className="cursor-pointer rounded-lg overflow-hidden"
                onClick={() => setSelIdx(i)}
              >
                <div
                  className="relative"
                  style={{
                    aspectRatio: '1/1',
                    border: i === selIdx ? '3px solid var(--brand-accent)' : '1px solid var(--border)',
                    borderRadius: 8,
                    backgroundImage: `url(https://picsum.photos/seed/insu${i + 10}/300/300)`,
                    backgroundSize: 'cover',
                  }}
                >
                  <div
                    className="absolute inset-0"
                    style={{ background: `rgba(0,0,0,${overlay / 100})`, borderRadius: 8 }}
                  />
                  <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: p.color }}
                    />
                    <span className="text-[11px] font-semibold text-white" style={{ textShadow: '0 1px 3px #000' }}>
                      {i + 1}
                    </span>
                  </div>
                  <div
                    className="absolute bottom-1.5 left-1.5 text-[10px] font-semibold text-white px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(0,0,0,0.6)' }}
                  >
                    {p.ko}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 중: 슬라이드 미리보기 */}
        <div
          className="rounded-xl border flex items-center justify-center p-6"
          style={{ background: '#0d0d0d', borderColor: 'var(--border)' }}
        >
          <SlidePreview
            slide={sel}
            layout={layout}
            blur={blur}
            overlay={overlay}
            textPos={textPos}
            accent={accent}
            photoSrc={photoSrc}
            slideIdx={selIdx}
            total={slides.length}
          />
        </div>

        {/* 우: 옵션 패널 */}
        <div className="flex flex-col gap-4 overflow-y-auto pl-1">
          {/* 레이아웃 템플릿 */}
          <div>
            <div className="text-[13px] font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              레이아웃 템플릿
            </div>
            <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {LAYOUTS.map(L => {
                const isBest = L.best.includes(sel.principle);
                const isOn = L.id === layout;
                return (
                  <div
                    key={L.id}
                    className="flex flex-col items-center justify-center gap-1 rounded-lg cursor-pointer relative transition-all"
                    style={{
                      aspectRatio: '1/1',
                      border: isOn ? '2px solid var(--brand-accent)' : '1px solid var(--border)',
                      background: isOn ? 'var(--brand-accent-bg)' : isBest ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                      opacity: isBest || isOn ? 1 : 0.55,
                      padding: 6,
                    }}
                    onClick={() => setLayout(L.id)}
                  >
                    <span className="text-[14px] font-bold" style={{ color: isOn ? 'var(--brand-accent)' : 'var(--text-primary)' }}>
                      {L.id}
                    </span>
                    <span className="text-[9px] text-center leading-tight" style={{ color: 'var(--text-muted)' }}>
                      {L.name}
                    </span>
                    {isBest && (
                      <span className="absolute top-1 right-1.5 text-[8px]" style={{ color: 'var(--brand-accent)' }}>★</span>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-[12px] mt-1.5 m-0" style={{ color: 'var(--text-muted)' }}>
              ★ 표시는 이 6원칙에 어울리는 템플릿
            </p>
          </div>

          {/* 배경 사진 */}
          <div>
            <div className="text-[13px] font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>배경 사진</div>
            <div className="flex gap-1.5">
              {['📤 업로드', '🔍 Unsplash', '🖼️ 라이브러리'].map(label => (
                <button
                  key={label}
                  className="flex-1 py-1.5 px-2 rounded-md text-[11px] font-semibold transition-colors truncate"
                  style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)' }}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 items-center mt-2">
              <div
                className="w-12 h-12 rounded-md flex-shrink-0"
                style={{ backgroundImage: `url(${photoSrc})`, backgroundSize: 'cover' }}
              />
              <div>
                <div className="text-[12px]" style={{ color: 'var(--text-primary)' }}>현재 사진</div>
                <div className="text-[12px]" style={{ color: 'var(--text-muted)' }}>picsum #insu{selIdx + 10}</div>
              </div>
            </div>
          </div>

          {/* 흐림 강도 */}
          <div>
            <div className="flex justify-between text-[13px] font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              <span>흐림 강도</span>
              <span style={{ color: 'var(--text-muted)' }}>{blur}px</span>
            </div>
            <input
              type="range"
              className="w-full h-1 rounded-full outline-none cursor-pointer"
              style={{ accentColor: 'var(--brand-accent)' }}
              min={0}
              max={20}
              value={blur}
              onChange={e => setBlur(Number(e.target.value))}
            />
          </div>

          {/* 어두운 오버레이 */}
          <div>
            <div className="flex justify-between text-[13px] font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              <span>어두운 오버레이</span>
              <span style={{ color: 'var(--text-muted)' }}>{overlay}%</span>
            </div>
            <input
              type="range"
              className="w-full h-1 rounded-full outline-none cursor-pointer"
              style={{ accentColor: 'var(--brand-accent)' }}
              min={0}
              max={90}
              value={overlay}
              onChange={e => setOverlay(Number(e.target.value))}
            />
          </div>

          {/* 전체 적용 */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded"
              style={{ accentColor: 'var(--brand-accent)' }}
              checked={applyAll}
              onChange={e => setApplyAll(e.target.checked)}
            />
            <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>전체 슬라이드 적용</span>
          </label>

          {/* 텍스트 위치 */}
          <div>
            <div className="text-[13px] font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>텍스트 위치</div>
            <div className="flex gap-2">
              {[['top', '상'], ['mid', '중'], ['bot', '하']].map(([k, v]) => (
                <div
                  key={k}
                  className="flex-1 py-2 px-3 rounded-lg border text-[13px] text-center cursor-pointer transition-all"
                  style={{
                    background: textPos === k ? 'var(--brand-accent-bg)' : 'var(--bg-tertiary)',
                    borderColor: textPos === k ? 'var(--brand-accent)' : 'var(--border)',
                    color: textPos === k ? 'var(--brand-accent)' : 'var(--text-secondary)',
                  }}
                  onClick={() => setTextPos(k)}
                >
                  {v}
                </div>
              ))}
            </div>
          </div>

          {/* 강조 컬러 */}
          <div>
            <div className="text-[13px] font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>강조 컬러</div>
            <div className="flex gap-2">
              {Object.entries(ACCENT_MAP).map(([k, c]) => (
                <button
                  key={k}
                  className="w-8 h-8 rounded-full cursor-pointer transition-all"
                  style={{
                    background: c,
                    border: accent === k ? '3px solid var(--text-primary)' : '1px solid var(--border)',
                  }}
                  onClick={() => setAccent(k)}
                />
              ))}
            </div>
          </div>

          <button
            className="py-2.5 rounded-lg font-semibold text-[14px] transition-colors mt-2"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)' }}
          >
            🔄 재렌더링
          </button>
        </div>
      </div>
    </div>
  );
}
