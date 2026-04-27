'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import * as htmlToImage from 'html-to-image';
import JSZip from 'jszip';
import { toast } from 'sonner';
import { PrincipleBadge } from './PrincipleBadge';
import { PhoneMockup } from './PhoneMockup';
import { SlideCanvas, type CanvasSlide } from './SlideCanvas';
import {
  addHashtagAction,
  removeHashtagAction,
  updateCaptionAction,
  updatePostStatusAction,
} from '@/app/(chrome)/posts/[id]/preview/actions';
import type { HashtagCategory, PostStatus } from '@/lib/supabase/types';

export type PreviewSlide = CanvasSlide & {
  id: string;
  speaker: string;
};

export type PreviewHashtags = Record<HashtagCategory, string[]>;

const CATEGORIES: [HashtagCategory, string][] = [
  ['brand', '브랜드'],
  ['topic', '주제'],
  ['target', '타겟'],
  ['general', '일반'],
];

const SAVE_DEBOUNCE_MS = 800;

function todayPlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function PreviewBody({
  postId,
  initialCaption,
  initialStatus,
  initialScheduleAt,
  initialHashtags,
  slides,
}: {
  postId: string;
  initialCaption: string;
  initialStatus: PostStatus;
  initialScheduleAt: string | null;
  initialHashtags: PreviewHashtags;
  slides: PreviewSlide[];
}) {
  const [idx, setIdx] = useState(0);
  const [pubStatus, setPubStatus] = useState<PostStatus>(initialStatus);
  const [scheduleDate, setScheduleDate] = useState(
    initialScheduleAt ? initialScheduleAt.slice(0, 10) : todayPlus(2),
  );
  const [caption, setCaption] = useState(initialCaption);
  const [editingCaption, setEditingCaption] = useState(false);
  const [tags, setTags] = useState<PreviewHashtags>(initialHashtags);
  const [adding, setAdding] = useState<HashtagCategory | null>(null);
  const [draftTag, setDraftTag] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [, startTransition] = useTransition();

  const exportHostRef = useRef<HTMLDivElement | null>(null);
  const captionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'TEXTAREA') return;
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.key === 'ArrowLeft') setIdx((i) => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setIdx((i) => Math.min(slides.length - 1, i + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [slides.length]);

  if (slides.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 gap-3 rounded-xl border"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
      >
        <div className="text-[40px]">📭</div>
        <div className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
          이 게시물에 슬라이드가 없습니다.
        </div>
      </div>
    );
  }

  const sel = slides[idx];

  const totalTags = Object.values(tags).reduce((a, t) => a + t.length, 0);
  const hashtagPreview = (() => {
    const all = ([] as string[])
      .concat(...Object.values(tags))
      .slice(0, 4)
      .map((t) => `#${t}`);
    return all.join(' ');
  })();

  // ─── Caption: debounced save ───
  const onCaptionChange = (next: string) => {
    setCaption(next);
    if (captionTimerRef.current) clearTimeout(captionTimerRef.current);
    captionTimerRef.current = setTimeout(() => {
      startTransition(async () => {
        const res = await updateCaptionAction(postId, next);
        if (res.error) toast.error(`캡션 저장 실패: ${res.error}`);
      });
    }, SAVE_DEBOUNCE_MS);
  };

  // ─── Hashtags ───
  const handleAddTag = (cat: HashtagCategory) => {
    const t = draftTag.replace(/^#+/, '').trim();
    if (!t) {
      setAdding(null);
      setDraftTag('');
      return;
    }
    if (tags[cat].includes(t)) {
      toast.error('이미 있는 태그입니다');
      return;
    }
    setTags((prev) => ({ ...prev, [cat]: [...prev[cat], t] }));
    setAdding(null);
    setDraftTag('');
    startTransition(async () => {
      const res = await addHashtagAction(postId, cat, t);
      if (res.error) {
        toast.error(`태그 추가 실패: ${res.error}`);
        // rollback
        setTags((prev) => ({ ...prev, [cat]: prev[cat].filter((x) => x !== t) }));
      }
    });
  };

  const handleRemoveTag = (cat: HashtagCategory, t: string) => {
    setTags((prev) => ({ ...prev, [cat]: prev[cat].filter((x) => x !== t) }));
    startTransition(async () => {
      const res = await removeHashtagAction(postId, cat, t);
      if (res.error) {
        toast.error(`태그 삭제 실패: ${res.error}`);
        setTags((prev) => ({ ...prev, [cat]: [...prev[cat], t] }));
      }
    });
  };

  // ─── Status ───
  const updateStatus = (next: PostStatus) => {
    setPubStatus(next);
    const isoDate = next === 'scheduled' ? `${scheduleDate}T09:00:00.000Z` : null;
    startTransition(async () => {
      const res = await updatePostStatusAction(postId, next, isoDate);
      if (res.error) {
        toast.error(`상태 변경 실패: ${res.error}`);
        setPubStatus(initialStatus);
      } else {
        toast(`✓ 상태 → ${next === 'draft' ? '초안' : next === 'scheduled' ? '게시 예정' : '게시 완료'}`);
      }
    });
  };

  const updateScheduleDate = (d: string) => {
    setScheduleDate(d);
    if (pubStatus !== 'scheduled') return;
    startTransition(async () => {
      await updatePostStatusAction(postId, 'scheduled', `${d}T09:00:00.000Z`);
    });
  };

  // ─── ZIP Download ───
  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    toast('🎨 1080×1080 이미지 9장 합성 중…');

    try {
      const host = exportHostRef.current;
      if (!host) throw new Error('export host not mounted');

      // Wait one tick to ensure DOM is rendered
      await new Promise((r) => setTimeout(r, 50));

      const zip = new JSZip();
      const nodes = host.querySelectorAll<HTMLElement>('[data-slide-export]');
      let captured = 0;

      for (let i = 0; i < nodes.length; i++) {
        const el = nodes[i];
        // Two-pass to ensure web fonts loaded into the rendered DOM
        await htmlToImage.toPng(el, { width: 1080, height: 1080, pixelRatio: 1 });
        const dataUrl = await htmlToImage.toPng(el, { width: 1080, height: 1080, pixelRatio: 1 });
        const base64 = dataUrl.split(',')[1];
        zip.file(`slide_${String(i + 1).padStart(2, '0')}.png`, base64, { base64: true });
        captured += 1;
      }

      // caption.txt
      zip.file('caption.txt', caption || '');

      // hashtags.txt
      const hashtagsText = CATEGORIES.map(([cat, label]) => {
        const list = tags[cat].map((t) => `#${t}`).join(' ');
        return `# ${label}\n${list}`;
      }).join('\n\n');
      zip.file('hashtags.txt', hashtagsText);

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `insu_insta_${postId.slice(0, 8)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast(`✓ ZIP 다운로드 완료 (${captured}장 + 텍스트)`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`다운로드 실패: ${msg}`);
    } finally {
      setDownloading(false);
    }
  };

  const btnSm = {
    background: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-strong)',
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* 캐러셀 + 폰 목업 */}
        <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 380px' }}>
          <div
            className="rounded-xl border p-6"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <button
                className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors disabled:opacity-40"
                style={btnSm}
                disabled={idx === 0}
                onClick={() => setIdx((i) => Math.max(0, i - 1))}
              >
                ◀
              </button>
              <span className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
                {idx + 1} / {slides.length}
              </span>
              <button
                className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors disabled:opacity-40"
                style={btnSm}
                disabled={idx === slides.length - 1}
                onClick={() => setIdx((i) => Math.min(slides.length - 1, i + 1))}
              >
                ▶
              </button>
            </div>

            {/* 슬라이드 미리보기 (디자인 적용 결과) */}
            <div className="relative mx-auto" style={{ maxWidth: 540 }}>
              <SlideCanvas
                slide={sel}
                size={540}
                showIndex
                totalSlides={slides.length}
              />
              <div className="absolute top-3 left-3">
                <PrincipleBadge principle={sel.principle} />
              </div>
            </div>

            {/* 도트 */}
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
              hashtagPreview={hashtagPreview}
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
              onClick={() => setEditingCaption((e) => !e)}
            >
              {editingCaption ? '완료' : '✏️ 편집'}
            </button>
          </div>
          {editingCaption ? (
            <textarea
              className="w-full px-3 py-2.5 rounded-lg border text-[14px] outline-none resize-none transition-colors leading-relaxed"
              style={{
                background: 'var(--bg-tertiary)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
              }}
              rows={5}
              value={caption}
              onChange={(e) => onCaptionChange(e.target.value)}
            />
          ) : (
            <div
              className="text-[14px] leading-relaxed whitespace-pre-wrap"
              style={{ color: caption ? 'var(--text-primary)' : 'var(--text-muted)' }}
            >
              {caption || '캡션이 비어 있습니다. 편집해주세요.'}
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
              {totalTags}개
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {CATEGORIES.map(([cat, label]) => (
              <div key={cat} className="flex items-center gap-3 flex-wrap">
                <span
                  className="text-[12px] font-semibold w-14 flex-shrink-0"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {label}:
                </span>
                {tags[cat].map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[12px] border"
                    style={{
                      background: 'var(--bg-tertiary)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <span style={{ color: 'var(--brand-accent)' }}>#{t}</span>
                    <span
                      className="cursor-pointer text-[10px] transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      onClick={() => handleRemoveTag(cat, t)}
                    >
                      ✕
                    </span>
                  </span>
                ))}
                {adding === cat ? (
                  <input
                    autoFocus
                    className="px-2 py-1 rounded-md text-[12px] outline-none"
                    style={{
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--brand-accent)',
                      color: 'var(--text-primary)',
                      width: 140,
                    }}
                    placeholder="태그 입력 후 Enter"
                    value={draftTag}
                    onChange={(e) => setDraftTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddTag(cat);
                      if (e.key === 'Escape') {
                        setAdding(null);
                        setDraftTag('');
                      }
                    }}
                    onBlur={() => handleAddTag(cat)}
                  />
                ) : (
                  <button
                    className="px-2 py-1 rounded-md text-[12px] transition-colors"
                    style={{
                      border: '1px dashed var(--border-strong)',
                      color: 'var(--text-secondary)',
                      background: 'transparent',
                    }}
                    onClick={() => {
                      setAdding(cat);
                      setDraftTag('');
                    }}
                  >
                    ＋ 추가
                  </button>
                )}
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
              {(
                [
                  ['draft', '초안 (저장만)'],
                  ['scheduled', '게시 예정'],
                  ['published', '게시 완료'],
                ] as const
              ).map(([k, v]) => (
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
                    onChange={() => updateStatus(k)}
                    style={{ accentColor: 'var(--brand-accent)' }}
                  />
                  <span className="text-[14px] font-medium">{v}</span>
                  {k === 'scheduled' && pubStatus === 'scheduled' && (
                    <input
                      type="date"
                      className="ml-auto px-2 py-1 rounded-md border text-[13px] outline-none"
                      style={{
                        background: 'var(--bg-tertiary)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)',
                      }}
                      value={scheduleDate}
                      onChange={(e) => updateScheduleDate(e.target.value)}
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
              ZIP에는 1080×1080 이미지 {slides.length}장 + caption.txt + hashtags.txt가 포함됩니다
            </p>
            <button
              className="w-full py-3 rounded-lg font-semibold text-[14px] transition-colors disabled:opacity-50"
              style={{ background: 'var(--brand-accent)', color: '#003320' }}
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? '🎨 합성 중…' : '📥 ZIP 다운로드'}
            </button>
          </div>
        </div>
      </div>

      {/* Off-screen 1080×1080 export host (used by ZIP download) */}
      <div
        ref={exportHostRef}
        aria-hidden
        style={{
          position: 'absolute',
          left: -99999,
          top: 0,
          width: 1080,
          height: 1080 * slides.length,
          pointerEvents: 'none',
          opacity: 0,
        }}
      >
        {slides.map((s) => (
          <div key={s.id} data-slide-export style={{ width: 1080, height: 1080 }}>
            <SlideCanvas slide={s} size={1080} />
          </div>
        ))}
      </div>
    </>
  );
}
