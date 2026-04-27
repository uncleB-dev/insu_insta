'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { SCRIPT_SLIDES, HASHTAGS } from '@/lib/mock';
import type { HashtagMap } from '@/lib/mock';
import { PrincipleBadge } from './PrincipleBadge';
import { PhoneMockup } from './PhoneMockup';

const DEFAULT_CAPTION =
  '"오빠 친구가 휴직하고 엄마 간병하는데 하루 20만원씩 나온대" — 이 카톡 한 줄이 시작이야. 진짜 그런 보험 있냐고? 있어. 비급여통합 + 진단비 두 개로 가는 게 핵심인데, 자세한 건 슬라이드에서. 저장해두고 부모님께 공유해줘.';

export function PreviewBody({ postId }: { postId: string }) {
  const slides = SCRIPT_SLIDES;
  const [idx, setIdx] = useState(0);
  const [pubStatus, setPubStatus] = useState<'draft' | 'scheduled' | 'published'>('draft');
  const [scheduleDate, setScheduleDate] = useState('2026-04-30');
  const [caption, setCaption] = useState(DEFAULT_CAPTION);
  const [editingCaption, setEditingCaption] = useState(false);
  const [tags, setTags] = useState<HashtagMap>(
    JSON.parse(JSON.stringify(HASHTAGS)) // deep clone
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setIdx(i => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setIdx(i => Math.min(slides.length - 1, i + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [slides.length]);

  const sel = slides[idx];

  const removeTag = (cat: keyof HashtagMap, t: string) => {
    setTags(prev => ({ ...prev, [cat]: prev[cat].filter(x => x !== t) }));
  };

  const handleDownload = () => {
    toast('✓ ZIP 다운로드 완료 (이미지 9장 + caption.txt)');
  };

  const btnSm = {
    background: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-strong)',
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 캐러셀 + 폰 목업 */}
      <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 380px' }}>
        {/* 캐러셀 */}
        <div
          className="rounded-xl border p-6"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <button
              className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors"
              style={btnSm}
              disabled={idx === 0}
              onClick={() => setIdx(i => Math.max(0, i - 1))}
            >
              ◀
            </button>
            <span className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
              {idx + 1} / {slides.length}
            </span>
            <button
              className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors"
              style={btnSm}
              disabled={idx === slides.length - 1}
              onClick={() => setIdx(i => Math.min(slides.length - 1, i + 1))}
            >
              ▶
            </button>
          </div>

          {/* 슬라이드 이미지 */}
          <div
            className="relative rounded-lg overflow-hidden mx-auto"
            style={{
              maxWidth: 540,
              aspectRatio: '1/1',
              backgroundImage: `url(https://picsum.photos/seed/insu${idx + 10}/800/800)`,
              backgroundSize: 'cover',
            }}
          >
            <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)' }} />
            <div className="absolute inset-0 flex flex-col justify-center p-8">
              <div
                className="self-start max-w-[80%] text-[20px] font-semibold leading-snug mb-3.5"
                style={{ background: '#fff', color: '#000', padding: '14px 18px', borderRadius: '4px 16px 16px 16px' }}
              >
                {sel.main}
              </div>
              <div className="text-[13px]" style={{ color: '#ddd', textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}>
                {sel.sub}
              </div>
            </div>
            <div className="absolute top-3 left-3">
              <PrincipleBadge principle={sel.principle} />
            </div>
          </div>

          {/* 도트 인디케이터 */}
          <div className="flex gap-1.5 justify-center mt-4">
            {slides.map((_, i) => (
              <button
                key={i}
                className="h-2 rounded-full transition-all border-none cursor-pointer"
                style={{
                  width: i === idx ? 24 : 8,
                  background: i === idx ? 'var(--brand-accent)' : 'var(--bg-tertiary)',
                }}
                onClick={() => setIdx(i)}
              />
            ))}
          </div>

          <div className="flex justify-center mt-4">
            <button
              className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
              style={{ color: 'var(--text-secondary)', background: 'transparent' }}
              onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              💾 이 슬라이드 저장
            </button>
          </div>
        </div>

        {/* 폰 목업 */}
        <div
          className="rounded-xl border flex items-center justify-center p-6"
          style={{ background: '#0d0d0d', borderColor: 'var(--border)' }}
        >
          <PhoneMockup
            slide={sel}
            slideIdx={idx}
            totalSlides={slides.length}
            caption={caption}
          />
        </div>
      </div>

      {/* 캡션 */}
      <div
        className="rounded-xl border p-6"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="text-[18px] font-semibold">📝 캡션</div>
          <button
            className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
            style={{ color: 'var(--text-secondary)', background: 'transparent' }}
            onClick={() => setEditingCaption(e => !e)}
            onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            {editingCaption ? '저장' : '✏️ 편집'}
          </button>
        </div>
        {editingCaption ? (
          <textarea
            className="w-full px-3 py-2.5 rounded-lg border text-[14px] outline-none resize-none transition-colors leading-relaxed"
            style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            rows={5}
            value={caption}
            onChange={e => setCaption(e.target.value)}
            onFocus={e => (e.target.style.borderColor = 'var(--brand-accent)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
          />
        ) : (
          <div className="text-[14px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
            {caption}
          </div>
        )}
      </div>

      {/* 해시태그 */}
      <div
        className="rounded-xl border p-6"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="text-[18px] font-semibold">🏷️ 해시태그</div>
          <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
            {Object.values(tags).flat().length}개
          </span>
        </div>
        <div className="flex flex-col gap-3">
          {([['brand', '브랜드'], ['topic', '주제'], ['target', '타겟'], ['general', '일반']] as [keyof HashtagMap, string][]).map(([cat, label]) => (
            <div key={cat} className="flex items-center gap-3 flex-wrap">
              <span className="text-[12px] font-semibold w-14 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                {label}:
              </span>
              {tags[cat].map(t => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[12px] border"
                  style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  <span style={{ color: 'var(--brand-accent)' }}>#{t}</span>
                  <span
                    className="cursor-pointer transition-colors text-[10px]"
                    style={{ color: 'var(--text-muted)' }}
                    onClick={() => removeTag(cat, t)}
                    onMouseOver={e => (e.currentTarget.style.color = 'var(--status-red)')}
                    onMouseOut={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    ✕
                  </span>
                </span>
              ))}
              <button
                className="px-2 py-1 rounded-md text-[12px] transition-colors"
                style={{ border: '1px dashed var(--border-strong)', color: 'var(--text-secondary)', background: 'transparent' }}
                onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                ＋ 추가
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 게시 상태 + 다운로드 */}
      <div className="grid grid-cols-2 gap-4">
        <div
          className="rounded-xl border p-6"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
        >
          <div className="text-[18px] font-semibold mb-3">📅 게시 상태</div>
          <div className="flex flex-col gap-2">
            {([['draft', '초안 (저장만)'], ['scheduled', '게시 예정'], ['published', '게시 완료']] as const).map(([k, v]) => (
              <label
                key={k}
                className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border transition-colors"
                style={{
                  background: pubStatus === k ? 'var(--brand-accent-bg)' : 'transparent',
                  borderColor: pubStatus === k ? 'var(--brand-accent)' : 'var(--border)',
                }}
              >
                <input
                  type="radio"
                  checked={pubStatus === k}
                  onChange={() => setPubStatus(k)}
                  style={{ accentColor: 'var(--brand-accent)' }}
                />
                <span className="text-[14px] font-medium">{v}</span>
                {k === 'scheduled' && pubStatus === 'scheduled' && (
                  <input
                    type="date"
                    className="ml-auto px-2 py-1 rounded-md border text-[13px] outline-none"
                    style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    value={scheduleDate}
                    onChange={e => setScheduleDate(e.target.value)}
                  />
                )}
              </label>
            ))}
          </div>
        </div>

        <div
          className="rounded-xl border p-6"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
        >
          <div className="text-[18px] font-semibold mb-2">📦 다운로드</div>
          <p className="text-[12px] mb-4 m-0" style={{ color: 'var(--text-secondary)' }}>
            ZIP에는 1080×1080 이미지 9장 + caption.txt + hashtags.txt가 포함됩니다
          </p>
          <button
            className="w-full py-3 rounded-lg font-semibold text-[14px] transition-colors"
            style={{ background: 'var(--brand-accent)', color: '#003320' }}
            onClick={handleDownload}
            onMouseOver={e => (e.currentTarget.style.background = 'var(--brand-accent-hover)')}
            onMouseOut={e => (e.currentTarget.style.background = 'var(--brand-accent)')}
          >
            📥 ZIP 다운로드
          </button>
        </div>
      </div>
    </div>
  );
}
