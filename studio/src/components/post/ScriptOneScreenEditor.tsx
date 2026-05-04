'use client';

// manual-flow-redesign Module 2+3:
// One-screen N-card script editor with inline guardrails.
// Replaces the old slide-list + edit-panel layout.

import { useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PRINCIPLES, type PrincipleKey } from '@/lib/principles';
import { evaluateGuards, type GuardrailRule } from '@/lib/guardrails';
import type { EditorSlide } from '@/lib/editor';
import type { Speaker } from '@/lib/supabase/types';
import { DebouncedTextarea } from './DebouncedTextarea';
import { GuardedText } from './GuardedText';
import { GuardrailScore } from './GuardrailScore';
import {
  addSlideAction,
  deleteSlideAction,
  updateSlideAction,
  type SlidePatch,
} from '@/app/(chrome)/posts/[id]/script/actions';

const SAVE_DEBOUNCE_MS = 500;

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const SPEAKER_OPTIONS: Array<[Speaker, string]> = [
  ['niece', '조카(좌)'],
  ['uncle', '삼촌(우)'],
  ['none', '없음(좌)'],
];

function speakerLayout(speaker: Speaker): string {
  return speaker === 'uncle' ? 'msg_right' : 'msg_left';
}

export function ScriptOneScreenEditor({
  postId,
  postTitle,
  initialSlides,
  rules,
}: {
  postId: string;
  postTitle: string;
  initialSlides: EditorSlide[];
  rules: GuardrailRule[];
}) {
  const router = useRouter();
  const [slides, setSlides] = useState<EditorSlide[]>(initialSlides);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [showWarn, setShowWarn] = useState(false);
  const [, startTransition] = useTransition();

  const debouncerRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const pendingPatchRef = useRef<Map<string, SlidePatch>>(new Map());

  // ─── Total guardrail count across all slides ───
  const totalGuards = useMemo(() => {
    let red = 0;
    let yellow = 0;
    let cleanCount = 0;
    for (const s of slides) {
      const allText = [s.main, s.main2 ?? '', s.main3 ?? '', s.main4 ?? '', s.sub]
        .filter(Boolean)
        .join('\n');
      const hits = evaluateGuards(allText, rules);
      const r = hits.filter((h) => h.kind === 'red').length;
      const y = hits.filter((h) => h.kind === 'yellow').length;
      red += r;
      yellow += y;
      if (hits.length === 0 && s.main.trim().length > 0) cleanCount += 1;
    }
    return { red, yellow, green: cleanCount };
  }, [slides, rules]);

  // ─── Debounced save ───
  const flushSlide = (slideId: string) => {
    const patch = pendingPatchRef.current.get(slideId);
    if (!patch) return;
    pendingPatchRef.current.delete(slideId);
    setSaveState('saving');
    startTransition(async () => {
      const res = await updateSlideAction(slideId, patch);
      if (res.error) {
        setSaveState('error');
        toast.error(`저장 실패: ${res.error}`);
        return;
      }
      setSaveState('saved');
      window.setTimeout(() => setSaveState('idle'), 1000);
    });
  };

  const queueSave = (slideId: string, patch: SlidePatch) => {
    const merged = { ...(pendingPatchRef.current.get(slideId) ?? {}), ...patch };
    pendingPatchRef.current.set(slideId, merged);
    const existing = debouncerRef.current.get(slideId);
    if (existing) clearTimeout(existing);
    const t = setTimeout(() => flushSlide(slideId), SAVE_DEBOUNCE_MS);
    debouncerRef.current.set(slideId, t);
    setSaveState('saving');
  };

  /** Apply a patch to a specific slide locally + queue server save. */
  const editSlide = (
    slideId: string,
    serverPatch: SlidePatch,
    localPatch: Partial<EditorSlide>,
  ) => {
    setSlides((prev) =>
      prev.map((s) => {
        if (s.id !== slideId) return s;
        const next = { ...s, ...localPatch };
        // Recompute guards if any text field changed
        if (
          'main' in localPatch ||
          'main2' in localPatch ||
          'main3' in localPatch ||
          'main4' in localPatch
        ) {
          const allText = [
            next.main,
            next.main2 ?? '',
            next.main3 ?? '',
            next.main4 ?? '',
          ]
            .filter(Boolean)
            .join('\n');
          next.guards = evaluateGuards(allText, rules);
        }
        return next;
      }),
    );
    queueSave(slideId, serverPatch);
  };

  // ─── Card actions ───
  const handleAddCard = () => {
    setSaveState('saving');
    startTransition(async () => {
      const res = await addSlideAction(postId);
      if (res.error || !res.slide) {
        setSaveState('error');
        toast.error(`추가 실패: ${res.error}`);
        return;
      }
      setSlides((prev) => [...prev, res.slide!]);
      setSaveState('saved');
      window.setTimeout(() => setSaveState('idle'), 1000);
    });
  };

  const handleDeleteCard = (slideId: string) => {
    if (slides.length <= 1) {
      toast.error('마지막 카드는 삭제할 수 없습니다');
      return;
    }
    if (!window.confirm('이 카드를 삭제할까요?')) return;
    setSaveState('saving');
    startTransition(async () => {
      const res = await deleteSlideAction(slideId);
      if (res.error) {
        setSaveState('error');
        toast.error(`삭제 실패: ${res.error}`);
        return;
      }
      setSlides((prev) => prev.filter((s) => s.id !== slideId));
      setSaveState('saved');
      window.setTimeout(() => setSaveState('idle'), 1000);
    });
  };

  // ─── Multi-message helpers ───
  const setBubble = (
    slide: EditorSlide,
    idx: 1 | 2 | 3 | 4,
    text: string,
    speaker: Speaker,
  ) => {
    if (idx === 1) {
      const layout = speakerLayout(speaker);
      editSlide(
        slide.id,
        { main_text: text, speaker, layout },
        { main: text, speaker, layout },
      );
    } else {
      // null = slot hidden; '' or non-empty string = slot visible (even if blank)
      const tk = `main_text${idx}` as 'main_text2' | 'main_text3' | 'main_text4';
      const sk = `speaker${idx}` as 'speaker2' | 'speaker3' | 'speaker4';
      const ltk = `main${idx}` as 'main2' | 'main3' | 'main4';
      editSlide(
        slide.id,
        { [tk]: text, [sk]: speaker } as SlidePatch,
        { [ltk]: text, [sk]: speaker } as Partial<EditorSlide>,
      );
    }
  };

  const removeBubble = (slide: EditorSlide, idx: 2 | 3 | 4) => {
    const tk = `main_text${idx}` as 'main_text2' | 'main_text3' | 'main_text4';
    const sk = `speaker${idx}` as 'speaker2' | 'speaker3' | 'speaker4';
    const ltk = `main${idx}` as 'main2' | 'main3' | 'main4';
    editSlide(
      slide.id,
      { [tk]: null, [sk]: null } as SlidePatch,
      { [ltk]: null, [sk]: null } as Partial<EditorSlide>,
    );
  };

  // ─── Auto-replace guard hit ───
  const handleAutoFix = (slide: EditorSlide, oldWord: string, newWord: string) => {
    const replaceIn = (s: string | null | undefined) =>
      typeof s === 'string' ? s.replaceAll(oldWord, newWord) : s;
    editSlide(
      slide.id,
      {
        main_text: replaceIn(slide.main) ?? '',
        main_text2: replaceIn(slide.main2) ?? null,
        main_text3: replaceIn(slide.main3) ?? null,
        main_text4: replaceIn(slide.main4) ?? null,
      },
      {
        main: replaceIn(slide.main) ?? '',
        main2: replaceIn(slide.main2) ?? null,
        main3: replaceIn(slide.main3) ?? null,
        main4: replaceIn(slide.main4) ?? null,
      },
    );
  };

  const handleAddEmphasis = (slide: EditorSlide) => {
    const word = window.prompt('강조할 단어/문구 입력');
    if (!word || !word.trim()) return;
    const next = [...slide.emphasis, word.trim()];
    editSlide(slide.id, { emphasis: next }, { emphasis: next });
  };

  const handleRemoveEmphasis = (slide: EditorSlide, i: number) => {
    const next = slide.emphasis.filter((_, j) => j !== i);
    editSlide(slide.id, { emphasis: next }, { emphasis: next });
  };

  const tryProceed = () => {
    if (totalGuards.red > 0) setShowWarn(true);
    else router.push(`/posts/${postId}/design`);
  };

  const saveLabel =
    saveState === 'saving'
      ? '저장 중…'
      : saveState === 'saved'
        ? '저장됨 ✓'
        : saveState === 'error'
          ? '저장 실패'
          : '';

  return (
    <>
      {/* Sticky header — guardrail counter + actions */}
      <div
        className="sticky top-0 z-20 flex items-center justify-between gap-4 px-2 py-3 mb-4 -mx-2"
        style={{
          background: 'var(--bg-primary)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-[20px]">2️⃣</span>
          <h1 className="text-[18px] font-bold m-0 truncate" title={postTitle}>
            {postTitle || '스크립트 작성'}
          </h1>
          <span className="text-[12px] flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>
            {slides.length}컷
          </span>
          {saveLabel && (
            <span
              className="text-[12px] flex-shrink-0"
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
        <div className="flex items-center gap-3 flex-shrink-0">
          <GuardrailScore
            green={totalGuards.green}
            yellow={totalGuards.yellow}
            red={totalGuards.red}
          />
          <button
            className="px-4 py-2 rounded-lg font-semibold text-[14px]"
            style={{ background: 'var(--brand-accent)', color: '#003320' }}
            onClick={tryProceed}
          >
            디자인으로 →
          </button>
        </div>
      </div>

      {/* All cards stacked */}
      <div className="flex flex-col gap-4">
        {slides.map((slide, idx) => (
          <ScriptCardEditor
            key={slide.id}
            slide={slide}
            cardNumber={idx + 1}
            totalCards={slides.length}
            onPrincipleChange={(p) =>
              editSlide(slide.id, { principle: p }, { principle: p })
            }
            onSetBubble={(bIdx, text, speaker) =>
              setBubble(slide, bIdx, text, speaker)
            }
            onRemoveBubble={(bIdx) => removeBubble(slide, bIdx)}
            onSubChange={(v) =>
              editSlide(slide.id, { sub_text: v }, { sub: v })
            }
            onSceneChange={(v) =>
              editSlide(slide.id, { scene: v }, { scene: v })
            }
            onAddEmphasis={() => handleAddEmphasis(slide)}
            onRemoveEmphasis={(i) => handleRemoveEmphasis(slide, i)}
            onAutoFix={(oldW, newW) => handleAutoFix(slide, oldW, newW)}
            onDelete={() => handleDeleteCard(slide.id)}
          />
        ))}
        <button
          className="flex items-center justify-center py-4 rounded-xl text-[14px] font-medium transition-colors"
          style={{
            border: '1.5px dashed var(--border-strong)',
            color: 'var(--text-secondary)',
            background: 'transparent',
          }}
          onClick={handleAddCard}
        >
          ＋ 카드 추가
        </button>
      </div>

      {/* Red guardrail confirmation */}
      {showWarn && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowWarn(false)}
        >
          <div
            className="p-7 rounded-2xl border"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', width: 460 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              className="text-[24px] font-bold m-0 mb-3"
              style={{ color: 'var(--status-red)' }}
            >
              ⚠️ 광고 심의 위험 {totalGuards.red}개
            </h2>
            <p className="text-[14px] mb-5" style={{ color: 'var(--text-secondary)' }}>
              레드 가드레일에 걸린 표현이 남아 있어요. 그대로 진행하시겠어요?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                className="px-4 py-2.5 rounded-lg font-semibold text-[14px]"
                style={{
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid transparent',
                }}
                onClick={() => setShowWarn(false)}
              >
                돌아가서 수정
              </button>
              <button
                className="px-4 py-2.5 rounded-lg font-semibold text-[14px]"
                style={{
                  background: 'transparent',
                  color: 'var(--status-red)',
                  border: '1px solid rgba(255,68,68,0.3)',
                }}
                onClick={() => {
                  setShowWarn(false);
                  router.push(`/posts/${postId}/design`);
                }}
              >
                위험 감수하고 진행
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Card editor (one of N) ───────────────────────────────────────────
function ScriptCardEditor({
  slide,
  cardNumber,
  totalCards,
  onPrincipleChange,
  onSetBubble,
  onRemoveBubble,
  onSubChange,
  onSceneChange,
  onAddEmphasis,
  onRemoveEmphasis,
  onAutoFix,
  onDelete,
}: {
  slide: EditorSlide;
  cardNumber: number;
  totalCards: number;
  onPrincipleChange: (p: PrincipleKey) => void;
  onSetBubble: (idx: 1 | 2 | 3 | 4, text: string, speaker: Speaker) => void;
  onRemoveBubble: (idx: 2 | 3 | 4) => void;
  onSubChange: (v: string) => void;
  onSceneChange: (v: string) => void;
  onAddEmphasis: () => void;
  onRemoveEmphasis: (i: number) => void;
  onAutoFix: (oldWord: string, newWord: string) => void;
  onDelete: () => void;
}) {
  const principleStyle = PRINCIPLES[slide.principle];
  const hasRed = slide.guards.some((g) => g.kind === 'red');
  const hasYellow = slide.guards.some((g) => g.kind === 'yellow');

  // Collect bubbles in order
  const bubbles = [
    { idx: 1 as const, text: slide.main, speaker: slide.speaker },
    { idx: 2 as const, text: slide.main2, speaker: slide.speaker2 },
    { idx: 3 as const, text: slide.main3, speaker: slide.speaker3 },
    { idx: 4 as const, text: slide.main4, speaker: slide.speaker4 },
  ];

  // null = slot hidden; '' (or non-empty) = slot visible
  // Find first hidden slot (text == null) for "add" button (slots 2-4)
  const firstEmptyForAdd = bubbles.find(
    (b) => b.idx > 1 && (b.text === null || b.text === undefined),
  )?.idx as 2 | 3 | 4 | undefined;

  // Visible bubbles: slot 1 always; slots 2-4 only if text is not null
  const visibleBubbles = bubbles.filter(
    (b) => b.idx === 1 || (b.text !== null && b.text !== undefined),
  );

  return (
    <div
      className="rounded-xl border p-5"
      style={{
        background: 'var(--bg-secondary)',
        borderColor: hasRed
          ? 'var(--status-red)'
          : hasYellow
            ? 'var(--status-yellow)'
            : 'var(--border)',
      }}
    >
      {/* Card header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
            style={{ background: principleStyle.color, color: '#000' }}
          >
            {cardNumber}
          </div>
          <select
            className="px-2 py-1 rounded-md border text-[12px] outline-none"
            style={{
              background: 'var(--bg-tertiary)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
            value={slide.principle}
            onChange={(e) => onPrincipleChange(e.target.value as PrincipleKey)}
          >
            {(Object.entries(PRINCIPLES) as [PrincipleKey, typeof PRINCIPLES[PrincipleKey]][]).map(
              ([k, v]) => (
                <option key={k} value={k}>
                  {v.emoji} {v.ko}
                </option>
              ),
            )}
          </select>
          {hasRed && <span className="text-[14px]">🔴</span>}
          {!hasRed && hasYellow && <span className="text-[14px]">🟡</span>}
        </div>
        <div className="flex items-center gap-1">
          <button
            className="px-2 py-1 rounded-md text-[11px] transition-colors"
            style={{
              background: 'transparent',
              color: 'var(--text-muted)',
              border: 'none',
            }}
            onClick={onDelete}
            title="카드 삭제"
            disabled={totalCards <= 1}
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Bubbles */}
      <div className="flex flex-col gap-2.5 mb-3">
        {visibleBubbles.map((b) => {
          const speaker = (b.speaker as Speaker) ?? 'niece';
          return (
            <div key={b.idx} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  말풍선 {b.idx}
                </span>
                <div className="flex items-center gap-1.5">
                  <SpeakerToggle
                    value={speaker}
                    onChange={(s) =>
                      onSetBubble(b.idx, b.text ?? '', s)
                    }
                  />
                  {b.idx > 1 && (
                    <button
                      type="button"
                      className="text-[11px] px-1.5 py-0.5 transition-colors"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                      }}
                      onClick={() => onRemoveBubble(b.idx as 2 | 3 | 4)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
              <DebouncedTextarea
                className="w-full px-3 py-2 rounded-lg border text-[13px] outline-none resize-none leading-relaxed"
                style={{
                  background: 'var(--bg-tertiary)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                  minHeight: 56,
                  whiteSpace: 'pre-wrap',
                }}
                value={b.text ?? ''}
                onChange={(v) => onSetBubble(b.idx, v, speaker)}
                placeholder={
                  b.idx === 1
                    ? speaker === 'niece'
                      ? '예: 삼촌, 5세대 실손 전환해야 해?'
                      : '예: 응, 그건 따져봐야 해.'
                    : '메시지를 입력하세요'
                }
              />
            </div>
          );
        })}
        {firstEmptyForAdd && (
          <button
            type="button"
            className="px-3 py-1.5 rounded-md text-[12px] transition-colors w-fit"
            style={{
              border: '1px dashed var(--border-strong)',
              color: 'var(--text-secondary)',
              background: 'transparent',
            }}
            onClick={() =>
              onSetBubble(
                firstEmptyForAdd,
                '',
                slide.principle === 'doubt' ? 'niece' : 'uncle',
              )
            }
          >
            ＋ 말풍선 {firstEmptyForAdd} 추가
          </button>
        )}
      </div>

      {/* Inline guardrail preview */}
      {slide.guards.length > 0 && (
        <div
          className="mt-2 px-3 py-2 rounded-lg text-[12px]"
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px dashed var(--border)',
          }}
        >
          <div className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>
            가드레일 ({slide.guards.length}) — 클릭하면 자동 교체
          </div>
          <GuardedText
            text={slide.main}
            guards={slide.guards}
            onReplace={onAutoFix}
          />
        </div>
      )}

      {/* Sub text + scene + emphasis (collapsed area) */}
      <details className="mt-3" style={{ color: 'var(--text-muted)' }}>
        <summary className="text-[11px] cursor-pointer select-none">
          ▾ 보조 설정 (장면 묘사 / 보조 텍스트 / 강조)
        </summary>
        <div className="flex flex-col gap-3 mt-3">
          <div>
            <div className="text-[11px] mb-1">장면 묘사</div>
            <DebouncedTextarea
              className="w-full px-3 py-2 rounded-lg border text-[12px] outline-none resize-none"
              style={{
                background: 'var(--bg-tertiary)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
                minHeight: 44,
              }}
              value={slide.scene}
              onChange={onSceneChange}
              placeholder="(선택) 디자인 단계 참고용"
            />
          </div>
          <div>
            <div className="text-[11px] mb-1">보조 텍스트</div>
            <DebouncedTextarea
              className="w-full px-3 py-2 rounded-lg border text-[12px] outline-none resize-none"
              style={{
                background: 'var(--bg-tertiary)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
                minHeight: 44,
              }}
              value={slide.sub}
              onChange={onSubChange}
              placeholder="(선택) 메시지 아래 작은 글씨"
            />
          </div>
          <div>
            <div className="text-[11px] mb-1">강조 표현</div>
            <div className="flex flex-wrap gap-1.5">
              {slide.emphasis.map((w, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px]"
                  style={{
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <b style={{ color: 'var(--brand-accent)' }}>{w}</b>
                  <span
                    className="cursor-pointer text-[10px]"
                    style={{ color: 'var(--text-muted)' }}
                    onClick={() => onRemoveEmphasis(i)}
                  >
                    ✕
                  </span>
                </span>
              ))}
              <button
                type="button"
                className="px-2 py-0.5 rounded text-[11px]"
                style={{
                  border: '1px dashed var(--border-strong)',
                  color: 'var(--text-secondary)',
                  background: 'transparent',
                }}
                onClick={onAddEmphasis}
              >
                ＋
              </button>
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}

function SpeakerToggle({
  value,
  onChange,
}: {
  value: Speaker;
  onChange: (s: Speaker) => void;
}) {
  return (
    <div className="flex gap-0.5">
      {SPEAKER_OPTIONS.map(([k, label]) => (
        <button
          key={k}
          type="button"
          className="px-1.5 py-0.5 rounded text-[10px] transition-colors"
          style={{
            background: value === k ? 'var(--brand-accent-bg)' : 'transparent',
            border: `1px solid ${value === k ? 'var(--brand-accent)' : 'var(--border)'}`,
            color: value === k ? 'var(--brand-accent)' : 'var(--text-secondary)',
            fontWeight: value === k ? 600 : 400,
          }}
          onClick={() => onChange(k)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
