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
  generateCaptionHashtagsAction,
  removeHashtagAction,
  updateCaptionAction,
  updatePostHeaderAction,
  updatePostStatusAction,
  updateRewardLinkAction,
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
  initialCtaKind,
  initialRewardLink,
  initialHeaderText,
  initialHeaderImageUrl,
  slides,
}: {
  postId: string;
  initialCaption: string;
  initialStatus: PostStatus;
  initialScheduleAt: string | null;
  initialHashtags: PreviewHashtags;
  initialCtaKind: string | null;
  initialRewardLink: string | null;
  initialHeaderText: string | null;
  initialHeaderImageUrl: string | null;
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
  const [generatingAi, setGeneratingAi] = useState(false);
  const [rewardLink, setRewardLink] = useState(initialRewardLink ?? '');
  const [headerText, setHeaderText] = useState(initialHeaderText ?? '');
  const [headerImageUrl, setHeaderImageUrl] = useState(initialHeaderImageUrl ?? '');
  const [, startTransition] = useTransition();
  const rewardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCommentLink = initialCtaKind === 'comment_link';

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

  // Inject current header into each slide so SlideCanvas + ZIP capture render it
  const slidesWithHeader = slides.map((s) => ({
    ...s,
    header_text: headerText || null,
    header_image_url: headerImageUrl || null,
  }));
  const sel = slidesWithHeader[idx];

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

  // ─── Reward link: debounced save (engagement-polish module 2d) ───
  const onRewardLinkChange = (next: string) => {
    setRewardLink(next);
    if (rewardTimerRef.current) clearTimeout(rewardTimerRef.current);
    rewardTimerRef.current = setTimeout(() => {
      startTransition(async () => {
        const res = await updateRewardLinkAction(postId, next);
        if (res.error) toast.error(`링크 저장 실패: ${res.error}`);
      });
    }, SAVE_DEBOUNCE_MS);
  };

  // ─── Header (slide-header-multi-msg): debounced save ───
  const queueHeaderSave = (nextText: string, nextImage: string) => {
    if (headerTimerRef.current) clearTimeout(headerTimerRef.current);
    headerTimerRef.current = setTimeout(() => {
      startTransition(async () => {
        const res = await updatePostHeaderAction(postId, nextText, nextImage);
        if (res.error) toast.error(`머릿말 저장 실패: ${res.error}`);
      });
    }, SAVE_DEBOUNCE_MS);
  };
  const onHeaderTextChange = (v: string) => {
    setHeaderText(v);
    queueHeaderSave(v, headerImageUrl);
  };
  const onHeaderImageChange = (v: string) => {
    setHeaderImageUrl(v);
    queueHeaderSave(headerText, v);
  };

  // ─── AI caption + hashtag generation (engagement-polish module 3) ───
  const handleAiGenerate = () => {
    if (generatingAi) return;
    if (caption.trim().length > 0) {
      const ok = window.confirm(
        '기존 캡션과 해시태그가 모두 교체됩니다. 진행할까요?',
      );
      if (!ok) return;
    }
    setGeneratingAi(true);
    toast('✨ Gemini가 검색 + 캡션·해시태그 생성 중… (10~25초)');
    startTransition(async () => {
      const res = await generateCaptionHashtagsAction(postId);
      setGeneratingAi(false);
      if (res.error) {
        toast.error(`AI 생성 실패: ${res.error}`);
        return;
      }
      toast('✓ AI 캡션·해시태그 생성 완료. 새로고침해서 확인하세요');
      // Force a reload to fetch fresh server data (revalidatePath alone may not
      // re-render this client component without a state hook).
      window.location.reload();
    });
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

        {/* 머릿말 편집 (slide-header-multi-msg) */}
        <div
          className="rounded-xl border p-6"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[18px]">🏷️</span>
            <div className="text-[18px] font-semibold">머릿말 (좌상단 브랜드)</div>
          </div>
          <p className="text-[12px] mb-4 m-0" style={{ color: 'var(--text-secondary)' }}>
            모든 9컷 슬라이드의 좌상단에 작게 표시됩니다. 이미지가 있으면 텍스트보다 우선 표시.
          </p>
          <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <div className="text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                텍스트
              </div>
              <input
                className="w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none transition-colors"
                style={{
                  background: 'var(--bg-tertiary)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                }}
                placeholder="예: 보험삼촌의 보험 이야기"
                value={headerText}
                onChange={(e) => onHeaderTextChange(e.target.value)}
              />
            </div>
            <div>
              <div className="text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                이미지 URL (선택)
              </div>
              <input
                className="w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none transition-colors font-mono"
                style={{
                  background: 'var(--bg-tertiary)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                }}
                placeholder="https://... .png"
                value={headerImageUrl}
                onChange={(e) => onHeaderImageChange(e.target.value)}
              />
            </div>
          </div>
          {(headerText || headerImageUrl) && (
            <p className="text-[11px] mt-2 m-0" style={{ color: 'var(--text-muted)' }}>
              {headerImageUrl
                ? '✓ 이미지 사용 (텍스트는 무시됨)'
                : '✓ 텍스트 사용'}
            </p>
          )}
        </div>

        {/* 댓글 유도 CTA → reward_link 비공개 메모 (engagement-polish module 2d) */}
        {isCommentLink && (
          <div
            className="rounded-xl border p-6"
            style={{
              background: 'var(--bg-secondary)',
              borderColor: 'var(--brand-accent)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[18px]">🔒</span>
              <div className="text-[18px] font-semibold">댓글 단 사람에게 보낼 링크 (비공개 메모)</div>
            </div>
            <p className="text-[12px] mb-3 m-0" style={{ color: 'var(--text-secondary)' }}>
              나만 보는 메모입니다. 캡션·슬라이드에 노출되지 않으며, 게시 후 댓글 단 분들에게 DM으로 직접 보내실 때 참고용입니다.
            </p>
            <textarea
              className="w-full px-3 py-2.5 rounded-lg border text-[14px] outline-none resize-none transition-colors leading-relaxed"
              style={{
                background: 'var(--bg-tertiary)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
                minHeight: 60,
              }}
              rows={2}
              placeholder="https://notion.so/xxx 또는 카카오톡 채널 링크 (메모용)"
              value={rewardLink}
              onChange={(e) => onRewardLinkChange(e.target.value)}
            />
          </div>
        )}

        {/* 캡션 */}
        <div
          className="rounded-xl border p-6"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-[18px] font-semibold">📝 캡션</div>
            <div className="flex gap-2">
              <button
                className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors disabled:opacity-50"
                style={{
                  background: 'var(--brand-accent-bg)',
                  color: 'var(--brand-accent)',
                  border: '1px solid var(--brand-accent)',
                }}
                onClick={handleAiGenerate}
                disabled={generatingAi}
                title="Gemini로 캡션 + 해시태그 자동 생성"
              >
                {generatingAi ? '🎨 생성 중…' : '✨ AI 자동 생성'}
              </button>
              <button
                className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
                style={{ color: 'var(--text-secondary)', background: 'transparent' }}
                onClick={() => setEditingCaption((e) => !e)}
              >
                {editingCaption ? '완료' : '✏️ 편집'}
              </button>
            </div>
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
          height: 1080 * slidesWithHeader.length,
          pointerEvents: 'none',
          opacity: 0,
        }}
      >
        {slidesWithHeader.map((s) => (
          <div key={s.id} data-slide-export style={{ width: 1080, height: 1080 }}>
            <SlideCanvas slide={s} size={1080} />
          </div>
        ))}
      </div>
    </>
  );
}
