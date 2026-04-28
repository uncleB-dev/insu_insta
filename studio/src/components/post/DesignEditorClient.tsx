'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PRINCIPLES, type PrincipleKey } from '@/lib/principles';
import type { Principle, Speaker } from '@/lib/supabase/types';
import {
  SlideCanvas,
  defaultLineHeight,
  defaultMainFontSize,
  defaultSubFontSize,
} from './SlideCanvas';
import {
  applyDesignToAllAction,
  generateBackgroundAction,
  setSlideBackgroundAction,
  updateSlideDesignAction,
  type DesignPatch,
} from '@/app/(chrome)/posts/[id]/design/actions';

export type DesignSlide = {
  id: string;
  ord: number;
  principle: Principle;
  speaker: Speaker;
  main: string;
  sub: string;
  emphasis: string[];
  layout: string;
  blur: number;
  overlay: number;
  text_pos: string;
  accent_color: string;
  bg_photo_id: string | null;
  bg_src: string;
  /** null = use layout default */
  main_font_size: number | null;
  sub_font_size: number | null;
  line_height: number | null;
  // slide-header-multi-msg
  main2: string | null;
  main3: string | null;
  main4: string | null;
  speaker2: Speaker | null;
  speaker3: Speaker | null;
  speaker4: Speaker | null;
  header_text: string | null;
  header_image_url: string | null;
};

export type LibraryPhoto = {
  id: string;
  src: string;
};

// Templates now come from DB (slide-templates feature) — passed as props.
export type DesignTemplate = {
  slug: string;
  name: string;
  description: string | null;
  default_for_principle: PrincipleKey | null;
};

const ACCENT_MAP: Record<string, string> = {
  green: '#00FF88',
  yellow: '#FFD23F',
  red: '#FF4D6D',
  white: '#FFFFFF',
};

const SAVE_DEBOUNCE_MS = 700;

function fallbackBg(slide: DesignSlide) {
  return slide.bg_src || `https://picsum.photos/seed/insu${slide.ord + 10}/800/800`;
}

// Use shared SlideCanvas as single source of truth for rendering
function SlidePreview({ slide }: { slide: DesignSlide }) {
  return (
    <div className="rounded-lg overflow-hidden" style={{ width: 'min(540px, 100%)' }}>
      <SlideCanvas slide={slide} size={540} />
    </div>
  );
}

// ─── Font size + line height controls ───────────────────────
// Plan SC-1, SC-2, SC-3, SC-5: per-slide override sliders with reset.
function FontSizeSlider({
  label,
  value,
  defaultValue,
  min,
  max,
  step,
  unit,
  onChange,
  onReset,
}: {
  label: string;
  value: number | null;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (next: number) => void;
  onReset: () => void;
}) {
  const isCustom = value !== null;
  const current = value ?? defaultValue;
  const display = step < 1 ? current.toFixed(2) : String(current);

  return (
    <div>
      <div
        className="flex justify-between items-center text-[13px] font-semibold mb-2"
        style={{ color: 'var(--text-primary)' }}
      >
        <span>
          {label}
          {!isCustom && (
            <span className="text-[10px] ml-1" style={{ color: 'var(--text-muted)' }}>
              (기본값)
            </span>
          )}
        </span>
        <div className="flex items-center gap-2">
          <span style={{ color: 'var(--text-muted)' }}>
            {display}
            {unit}
          </span>
          {isCustom && (
            <button
              className="text-[11px] px-1.5 py-0.5 rounded transition-colors"
              style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none' }}
              onClick={onReset}
              title="레이아웃 기본값으로 복원"
            >
              ↺
            </button>
          )}
        </div>
      </div>
      <input
        type="range"
        className="w-full h-1 rounded-full outline-none cursor-pointer"
        style={{
          accentColor: isCustom ? 'var(--brand-accent)' : 'var(--text-muted)',
        }}
        min={min}
        max={max}
        step={step}
        value={current}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function FontSizeControls({
  sel,
  editSelected,
}: {
  sel: DesignSlide;
  editSelected: (patch: import('@/app/(chrome)/posts/[id]/design/actions').DesignPatch) => void;
}) {
  return (
    <>
      <div className="h-px" style={{ background: 'var(--border)' }} />
      <FontSizeSlider
        label="메인 글자 크기"
        value={sel.main_font_size}
        defaultValue={defaultMainFontSize(sel.layout)}
        min={16}
        max={64}
        step={1}
        unit="px"
        onChange={(v) => editSelected({ main_font_size: v })}
        onReset={() => editSelected({ main_font_size: null })}
      />
      <FontSizeSlider
        label="보조 글자 크기"
        value={sel.sub_font_size}
        defaultValue={defaultSubFontSize(sel.layout)}
        min={10}
        max={32}
        step={1}
        unit="px"
        onChange={(v) => editSelected({ sub_font_size: v })}
        onReset={() => editSelected({ sub_font_size: null })}
      />
      <FontSizeSlider
        label="줄 간격"
        value={sel.line_height}
        defaultValue={defaultLineHeight(sel.layout)}
        min={1.0}
        max={2.0}
        step={0.05}
        unit=""
        onChange={(v) => editSelected({ line_height: Number(v.toFixed(2)) })}
        onReset={() => editSelected({ line_height: null })}
      />
    </>
  );
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function DesignEditorClient({
  postId,
  initialSlides,
  libraryPhotos,
  templates,
}: {
  postId: string;
  initialSlides: DesignSlide[];
  libraryPhotos: LibraryPhoto[];
  templates: DesignTemplate[];
}) {
  const router = useRouter();
  const [slides, setSlides] = useState<DesignSlide[]>(initialSlides);
  const [photos, setPhotos] = useState<LibraryPhoto[]>(libraryPhotos);
  const [selIdx, setSelIdx] = useState(0);
  const [applyAll, setApplyAll] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [, startTransition] = useTransition();

  const debouncerRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const pendingPatchRef = useRef<Map<string, DesignPatch>>(new Map());

  const sel = slides[selIdx];

  useEffect(() => {
    const timers = debouncerRef.current;
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  const flushSlide = (slideId: string) => {
    const patch = pendingPatchRef.current.get(slideId);
    if (!patch) return;
    pendingPatchRef.current.delete(slideId);
    setSaveState('saving');
    startTransition(async () => {
      const res = await updateSlideDesignAction(slideId, patch);
      if (res.error) {
        setSaveState('error');
        toast.error(`저장 실패: ${res.error}`);
        return;
      }
      setSaveState('saved');
      window.setTimeout(() => setSaveState('idle'), 1000);
    });
  };

  const queueSave = (slideId: string, patch: DesignPatch) => {
    const merged = { ...(pendingPatchRef.current.get(slideId) ?? {}), ...patch };
    pendingPatchRef.current.set(slideId, merged);
    const existing = debouncerRef.current.get(slideId);
    if (existing) clearTimeout(existing);
    const t = setTimeout(() => flushSlide(slideId), SAVE_DEBOUNCE_MS);
    debouncerRef.current.set(slideId, t);
    setSaveState('saving');
  };

  const editSelected = (patch: DesignPatch) => {
    if (!sel) return;
    if (applyAll) {
      // Apply locally to all + server bulk
      setSlides((prev) => prev.map((s) => ({ ...s, ...patch })));
      setSaveState('saving');
      startTransition(async () => {
        const res = await applyDesignToAllAction(postId, patch);
        if (res.error) {
          setSaveState('error');
          toast.error(`전체 적용 실패: ${res.error}`);
          return;
        }
        setSaveState('saved');
        window.setTimeout(() => setSaveState('idle'), 1000);
      });
    } else {
      const sid = sel.id;
      setSlides((prev) =>
        prev.map((s, i) => (i === selIdx ? { ...s, ...patch } : s)),
      );
      queueSave(sid, patch);
    }
  };

  const setBackground = (photo: LibraryPhoto | null) => {
    if (!sel) return;
    const newBg = photo?.src ?? '';
    const sid = sel.id;
    setSlides((prev) =>
      prev.map((s, i) =>
        i === selIdx ? { ...s, bg_photo_id: photo?.id ?? null, bg_src: newBg } : s,
      ),
    );
    setSaveState('saving');
    startTransition(async () => {
      const res = await setSlideBackgroundAction(sid, photo?.id ?? null);
      if (res.error) {
        setSaveState('error');
        toast.error(`적용 실패: ${res.error}`);
        return;
      }
      setSaveState('saved');
      window.setTimeout(() => setSaveState('idle'), 1000);
    });
  };

  const handleGenerateAI = () => {
    if (!sel) return;
    if (!aiPrompt.trim()) {
      toast.error('프롬프트를 입력해주세요');
      return;
    }
    setAiBusy(true);
    startTransition(async () => {
      const res = await generateBackgroundAction({
        prompt: aiPrompt.trim(),
        slideId: sel.id,
        bindToSlide: true,
      });
      setAiBusy(false);
      if (res.error || !res.photo) {
        toast.error(res.error ?? 'AI 생성 실패');
        return;
      }
      const newPhoto = { id: res.photo.id, src: res.photo.src };
      setPhotos((prev) => [newPhoto, ...prev]);
      setSlides((prev) =>
        prev.map((s, i) =>
          i === selIdx
            ? { ...s, bg_photo_id: newPhoto.id, bg_src: newPhoto.src }
            : s,
        ),
      );
      toast('✓ AI 배경 생성 + 적용 완료');
      setShowAiModal(false);
      setAiPrompt('');
    });
  };

  const fillAiPromptFromSlide = () => {
    if (!sel) return;
    setAiPrompt(
      `보험 카드뉴스 배경. 분위기: ${PRINCIPLES[sel.principle].ko}. 장면 묘사 힌트: ${sel.main}. 한국 인스타그램 감성, 깊은 톤, 텍스트가 위에 올라갈 수 있도록 중앙 단순한 배경, 1:1 정사각.`,
    );
  };

  const saveLabel =
    saveState === 'saving'
      ? '저장 중…'
      : saveState === 'saved'
        ? '저장됨 ✓'
        : saveState === 'error'
          ? '저장 실패'
          : '';

  if (!sel) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="text-[40px]">📭</div>
        <div className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
          이 게시물에 슬라이드가 없습니다. 스크립트 단계에서 추가해주세요.
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="flex flex-col gap-4"
        style={{ height: 'calc(100vh - 56px - 64px)', minHeight: 0 }}
      >
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[24px]">3️⃣</span>
            <h1 className="text-[24px] font-bold m-0">이미지 합성</h1>
            {saveLabel && (
              <span
                className="text-[12px] ml-2"
                style={{
                  color:
                    saveState === 'error'
                      ? 'var(--status-red)'
                      : saveState === 'saving'
                        ? 'var(--status-yellow)'
                        : 'var(--brand-accent)',
                }}
              >
                {saveLabel}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              className="px-4 py-2.5 rounded-lg font-semibold text-[14px]"
              style={{ background: 'transparent', color: 'var(--text-secondary)' }}
              onClick={() => router.push(`/posts/${postId}/script`)}
            >
              ← 스크립트로
            </button>
            <button
              className="px-4 py-2.5 rounded-lg font-semibold text-[14px]"
              style={{ background: 'var(--brand-accent)', color: '#003320' }}
              onClick={() => router.push(`/posts/${postId}/preview`)}
            >
              미리보기 →
            </button>
          </div>
        </div>

        <div className="grid gap-4 flex-1 min-h-0" style={{ gridTemplateColumns: '200px 1fr 320px' }}>
          {/* 좌: 썸네일 */}
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
                      backgroundImage: `url(${fallbackBg(s)})`,
                      backgroundSize: 'cover',
                    }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{ background: `rgba(0,0,0,${s.overlay / 100})`, borderRadius: 8 }}
                    />
                    <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                      <span
                        className="text-[11px] font-semibold text-white"
                        style={{ textShadow: '0 1px 3px #000' }}
                      >
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

          {/* 중: 미리보기 */}
          <div
            className="rounded-xl border flex items-center justify-center p-6"
            style={{ background: '#0d0d0d', borderColor: 'var(--border)' }}
          >
            <SlidePreview slide={sel} />
          </div>

          {/* 우: 옵션 */}
          <div className="flex flex-col gap-4 overflow-y-auto pl-1">
            <div>
              <div className="text-[13px] font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                레이아웃 템플릿
              </div>
              <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                {templates.map((t) => {
                  const isBest = t.default_for_principle === sel.principle;
                  const isOn = t.slug === sel.layout;
                  return (
                    <div
                      key={t.slug}
                      className="flex flex-col items-center justify-center gap-1 rounded-lg cursor-pointer relative transition-all"
                      style={{
                        aspectRatio: '1/1',
                        border: isOn ? '2px solid var(--brand-accent)' : '1px solid var(--border)',
                        background: isOn
                          ? 'var(--brand-accent-bg)'
                          : isBest
                            ? 'var(--bg-tertiary)'
                            : 'var(--bg-secondary)',
                        opacity: isBest || isOn ? 1 : 0.55,
                        padding: 6,
                      }}
                      onClick={() => editSelected({ layout: t.slug })}
                      title={t.description ?? undefined}
                    >
                      <span
                        className="text-[18px]"
                        style={{ lineHeight: 1 }}
                      >
                        {t.name.split(' ')[0]}
                      </span>
                      <span
                        className="text-[9px] text-center leading-tight"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {t.name.split(' ').slice(1).join(' ')}
                      </span>
                      {isBest && (
                        <span
                          className="absolute top-1 right-1.5 text-[8px]"
                          style={{ color: 'var(--brand-accent)' }}
                        >
                          ★
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-[12px] mt-1.5 m-0" style={{ color: 'var(--text-muted)' }}>
                ★ 표시는 이 6원칙에 어울리는 템플릿
              </p>
            </div>

            <div>
              <div className="text-[13px] font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                배경 사진
              </div>
              <div className="flex gap-1.5">
                <button
                  className="flex-1 py-1.5 px-2 rounded-md text-[11px] font-semibold transition-colors truncate"
                  style={{
                    background: 'var(--brand-accent-bg)',
                    color: 'var(--brand-accent)',
                    border: '1px solid var(--brand-accent)',
                  }}
                  onClick={() => {
                    fillAiPromptFromSlide();
                    setShowAiModal(true);
                  }}
                >
                  🎨 AI 생성
                </button>
                <button
                  className="flex-1 py-1.5 px-2 rounded-md text-[11px] font-semibold transition-colors truncate"
                  style={{
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-strong)',
                  }}
                  onClick={() => setShowLibrary(true)}
                >
                  🖼️ 라이브러리
                </button>
              </div>
              <div className="flex gap-2 items-center mt-2">
                <div
                  className="w-12 h-12 rounded-md flex-shrink-0"
                  style={{ backgroundImage: `url(${fallbackBg(sel)})`, backgroundSize: 'cover' }}
                />
                <div className="overflow-hidden">
                  <div className="text-[12px] truncate" style={{ color: 'var(--text-primary)' }}>
                    현재 사진
                  </div>
                  <div className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                    {sel.bg_photo_id ? '커스텀' : 'picsum 기본'}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div
                className="flex justify-between text-[13px] font-semibold mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                <span>흐림 강도</span>
                <span style={{ color: 'var(--text-muted)' }}>{sel.blur}px</span>
              </div>
              <input
                type="range"
                className="w-full h-1 rounded-full outline-none cursor-pointer"
                style={{ accentColor: 'var(--brand-accent)' }}
                min={0}
                max={20}
                value={sel.blur}
                onChange={(e) => editSelected({ blur: Number(e.target.value) })}
              />
            </div>

            <div>
              <div
                className="flex justify-between text-[13px] font-semibold mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                <span>어두운 오버레이</span>
                <span style={{ color: 'var(--text-muted)' }}>{sel.overlay}%</span>
              </div>
              <input
                type="range"
                className="w-full h-1 rounded-full outline-none cursor-pointer"
                style={{ accentColor: 'var(--brand-accent)' }}
                min={0}
                max={90}
                value={sel.overlay}
                onChange={(e) => editSelected({ overlay: Number(e.target.value) })}
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded"
                style={{ accentColor: 'var(--brand-accent)' }}
                checked={applyAll}
                onChange={(e) => setApplyAll(e.target.checked)}
              />
              <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                전체 슬라이드 적용
              </span>
            </label>

            <div>
              <div className="text-[13px] font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                텍스트 위치
              </div>
              <div className="flex gap-2">
                {[
                  ['top', '상'],
                  ['mid', '중'],
                  ['bot', '하'],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="flex-1 py-2 px-3 rounded-lg border text-[13px] text-center cursor-pointer transition-all"
                    style={{
                      background: sel.text_pos === k ? 'var(--brand-accent-bg)' : 'var(--bg-tertiary)',
                      borderColor: sel.text_pos === k ? 'var(--brand-accent)' : 'var(--border)',
                      color: sel.text_pos === k ? 'var(--brand-accent)' : 'var(--text-secondary)',
                    }}
                    onClick={() => editSelected({ text_pos: k })}
                  >
                    {v}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[13px] font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                강조 컬러
              </div>
              <div className="flex gap-2">
                {Object.entries(ACCENT_MAP).map(([k, c]) => (
                  <button
                    key={k}
                    className="w-8 h-8 rounded-full cursor-pointer transition-all"
                    style={{
                      background: c,
                      border:
                        sel.accent_color === k
                          ? '3px solid var(--text-primary)'
                          : '1px solid var(--border)',
                    }}
                    onClick={() => editSelected({ accent_color: k })}
                  />
                ))}
              </div>
            </div>

            {/* 글자 크기 / 줄 간격 — design-font-size 기능 */}
            <FontSizeControls sel={sel} editSelected={editSelected} />
          </div>
        </div>
      </div>

      {/* 라이브러리 Sheet */}
      {showLibrary && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowLibrary(false)}
        >
          <div
            className="w-full rounded-t-2xl border-t p-6 flex flex-col gap-4"
            style={{
              background: 'var(--bg-secondary)',
              borderColor: 'var(--border)',
              maxHeight: '70vh',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="text-[18px] font-semibold">🖼️ 라이브러리에서 선택</div>
              <button
                className="text-[14px]"
                style={{ color: 'var(--text-muted)' }}
                onClick={() => setShowLibrary(false)}
              >
                ✕
              </button>
            </div>
            {photos.length === 0 ? (
              <div
                className="py-12 text-center text-[14px]"
                style={{ color: 'var(--text-muted)' }}
              >
                라이브러리에 사진이 없습니다. AI 생성을 사용해보세요.
              </div>
            ) : (
              <div
                className="grid gap-3 overflow-y-auto"
                style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}
              >
                {photos.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-lg overflow-hidden cursor-pointer transition-all"
                    style={{
                      aspectRatio: '1/1',
                      backgroundImage: `url(${p.src})`,
                      backgroundSize: 'cover',
                      outline:
                        sel.bg_photo_id === p.id
                          ? '3px solid var(--brand-accent)'
                          : '1px solid var(--border)',
                    }}
                    onClick={() => {
                      setBackground(p);
                      setShowLibrary(false);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI 생성 모달 */}
      {showAiModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => !aiBusy && setShowAiModal(false)}
        >
          <div
            className="p-7 rounded-2xl border flex flex-col gap-4"
            style={{
              background: 'var(--bg-secondary)',
              borderColor: 'var(--border)',
              width: 520,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <span className="text-[24px]">🎨</span>
              <h2 className="text-[20px] font-bold m-0">AI 배경 생성 (Nano Banana)</h2>
            </div>
            <p className="text-[12px] m-0" style={{ color: 'var(--text-secondary)' }}>
              현재 슬라이드의 6원칙·메인 텍스트를 참고해 자동으로 프롬프트를 만들었습니다. 자유롭게
              수정하세요.
            </p>
            <textarea
              className="w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none resize-none font-mono"
              style={{
                background: 'var(--bg-tertiary)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
                minHeight: 140,
                fontFamily: 'var(--font-mono)',
              }}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              disabled={aiBusy}
            />
            <div className="flex gap-2 justify-end">
              <button
                className="px-4 py-2 rounded-lg text-[14px] font-medium disabled:opacity-50"
                style={{
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                }}
                disabled={aiBusy}
                onClick={() => setShowAiModal(false)}
              >
                취소
              </button>
              <button
                className="px-4 py-2 rounded-lg text-[14px] font-semibold disabled:opacity-50"
                style={{ background: 'var(--brand-accent)', color: '#003320', border: 'none' }}
                disabled={aiBusy || !aiPrompt.trim()}
                onClick={handleGenerateAI}
              >
                {aiBusy ? '🎨 생성 중… (10~20초)' : '✨ 생성하고 적용'}
              </button>
            </div>
            <p className="text-[11px] m-0" style={{ color: 'var(--text-muted)' }}>
              * 1장 생성 = Gemini Nano Banana 1회 호출 (약 $0.039)
            </p>
          </div>
        </div>
      )}
    </>
  );
}
