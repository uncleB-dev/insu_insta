'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PRINCIPLES, type PrincipleKey } from '@/lib/principles';
import { evaluateGuards, type GuardrailRule } from '@/lib/guardrails';
import type { EditorSlide } from '@/lib/editor';
import type { Speaker } from '@/lib/supabase/types';
import { SlideCard } from '@/components/post/SlideCard';
import { GuardrailScore } from '@/components/post/GuardrailScore';
import { PrincipleBadge } from '@/components/post/PrincipleBadge';
import { GuardedText } from '@/components/post/GuardedText';
import {
  addSlideAction,
  deleteSlideAction,
  updateSlideAction,
  type SlidePatch,
} from '@/app/(chrome)/posts/[id]/script/actions';

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[13px] font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
      {children}
    </div>
  );
}

function RadioPill<T extends string>({
  options,
  value,
  onChange,
}: {
  options: [T, string][];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-2">
      {options.map(([k, label]) => (
        <div
          key={k}
          className="flex-1 py-2.5 px-3 rounded-lg border text-[13px] text-center cursor-pointer transition-all"
          style={{
            background: value === k ? 'var(--brand-accent-bg)' : 'var(--bg-tertiary)',
            borderColor: value === k ? 'var(--brand-accent)' : 'var(--border)',
            color: value === k ? 'var(--brand-accent)' : 'var(--text-secondary)',
            fontWeight: value === k ? 600 : 400,
          }}
          onClick={() => onChange(k)}
        >
          {label}
        </div>
      ))}
    </div>
  );
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const SAVE_DEBOUNCE_MS = 800;

export function ScriptEditorClient({
  postId,
  initialSlides,
  rules,
}: {
  postId: string;
  initialSlides: EditorSlide[];
  rules: GuardrailRule[];
}) {
  const router = useRouter();
  const [slides, setSlides] = useState<EditorSlide[]>(initialSlides);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [showWarn, setShowWarn] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [, startTransition] = useTransition();
  const debouncerRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const pendingPatchRef = useRef<Map<string, SlidePatch>>(new Map());

  const selected = slides[selectedIdx];

  const stats = useMemo(() => {
    const yellow = slides.reduce(
      (a, s) => a + s.guards.filter((g) => g.kind === 'yellow').length,
      0,
    );
    const red = slides.reduce(
      (a, s) => a + s.guards.filter((g) => g.kind === 'red').length,
      0,
    );
    const green = slides.filter((s) => s.guards.length === 0).length;
    return { yellow, red, green };
  }, [slides]);

  // Cleanup pending timeouts on unmount
  useEffect(() => {
    const timers = debouncerRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, []);

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
      if (res.slide) {
        setSlides((prev) => prev.map((s) => (s.id === slideId ? res.slide! : s)));
      }
      setSaveState('saved');
      window.setTimeout(() => setSaveState('idle'), 1200);
    });
  };

  const queueSave = (slideId: string, patch: SlidePatch) => {
    const merged = { ...(pendingPatchRef.current.get(slideId) ?? {}), ...patch };
    pendingPatchRef.current.set(slideId, merged);

    const existing = debouncerRef.current.get(slideId);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => flushSlide(slideId), SAVE_DEBOUNCE_MS);
    debouncerRef.current.set(slideId, timer);
    setSaveState('saving');
  };

  /** Update local state immediately + queue debounced server save.
   * `localPatch` is what to merge into the EditorSlide locally (may differ from DB shape). */
  const editSelected = (
    serverPatch: SlidePatch,
    localPatch: Partial<EditorSlide>,
    recomputeGuards = false,
  ) => {
    const sid = selected.id;
    setSlides((prev) =>
      prev.map((s, i) => {
        if (i !== selectedIdx) return s;
        const next = { ...s, ...localPatch };
        if (recomputeGuards) {
          next.guards = evaluateGuards(next.main, rules);
        }
        return next;
      }),
    );
    queueSave(sid, serverPatch);
  };

  const handleAutoFix = (oldWord: string, newWord: string) => {
    const newMain = selected.main.replaceAll(oldWord, newWord);
    editSelected({ main_text: newMain }, { main: newMain }, true);
  };

  const handleAddEmphasis = () => {
    const word = window.prompt('강조할 단어/문구를 입력하세요');
    if (!word || !word.trim()) return;
    const next = [...selected.emphasis, word.trim()];
    editSelected({ emphasis: next }, { emphasis: next });
  };

  const handleRemoveEmphasis = (idx: number) => {
    const next = selected.emphasis.filter((_, i) => i !== idx);
    editSelected({ emphasis: next }, { emphasis: next });
  };

  const handleAddSlide = () => {
    setSaveState('saving');
    startTransition(async () => {
      const res = await addSlideAction(postId);
      if (res.error || !res.slide) {
        setSaveState('error');
        toast.error(`추가 실패: ${res.error}`);
        return;
      }
      setSlides((prev) => [...prev, res.slide!]);
      setSelectedIdx(slides.length);
      setSaveState('saved');
      window.setTimeout(() => setSaveState('idle'), 1200);
    });
  };

  const handleDeleteSlide = () => {
    if (slides.length <= 1) {
      toast.error('마지막 슬라이드는 삭제할 수 없어요');
      return;
    }
    if (!window.confirm(`슬라이드 ${selectedIdx + 1}을 삭제할까요?`)) return;

    const sid = selected.id;
    setSaveState('saving');
    startTransition(async () => {
      const res = await deleteSlideAction(sid);
      if (res.error) {
        setSaveState('error');
        toast.error(`삭제 실패: ${res.error}`);
        return;
      }
      setSlides((prev) => prev.filter((s) => s.id !== sid));
      setSelectedIdx((i) => Math.max(0, Math.min(i, slides.length - 2)));
      setSaveState('saved');
      window.setTimeout(() => setSaveState('idle'), 1200);
    });
  };

  const tryProceed = () => {
    if (stats.red > 0) setShowWarn(true);
    else router.push(`/posts/${postId}/design`);
  };

  const textareaStyle = {
    background: 'var(--bg-tertiary)',
    borderColor: 'var(--border)',
    color: 'var(--text-primary)',
  };

  if (!selected) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="text-[40px]">📭</div>
        <div className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
          이 게시물에 슬라이드가 없습니다.
        </div>
        <button
          className="px-4 py-2.5 rounded-lg font-semibold text-[14px]"
          style={{ background: 'var(--brand-accent)', color: '#003320' }}
          onClick={handleAddSlide}
        >
          ＋ 슬라이드 추가
        </button>
      </div>
    );
  }

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
      <div
        className="flex flex-col gap-4"
        style={{ height: 'calc(100vh - 56px - 64px)', minHeight: 0 }}
      >
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[24px]">2️⃣</span>
            <h1 className="text-[24px] font-bold m-0">스크립트 편집</h1>
            <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
              {slides.length}컷
            </span>
            {saveLabel && (
              <span
                className="text-[12px] ml-2 transition-opacity"
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
              style={{
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-strong)',
              }}
              onClick={() => toast('AI 재생성은 다음 단계에서 연결됩니다')}
            >
              🔄 전체 재생성
            </button>
            <button
              className="px-4 py-2.5 rounded-lg font-semibold text-[14px]"
              style={{ background: 'var(--brand-accent)', color: '#003320' }}
              onClick={tryProceed}
            >
              디자인 →
            </button>
          </div>
        </div>

        <GuardrailScore green={stats.green} yellow={stats.yellow} red={stats.red} />

        <div className="grid gap-4 flex-1 min-h-0" style={{ gridTemplateColumns: '360px 1fr' }}>
          <div className="flex flex-col gap-2 overflow-y-auto pr-1">
            {slides.map((s, i) => (
              <SlideCard
                key={s.id}
                index={i}
                slide={s}
                selected={i === selectedIdx}
                onClick={() => setSelectedIdx(i)}
              />
            ))}
            <button
              className="flex items-center justify-center py-3.5 rounded-[10px] text-[14px] font-medium transition-colors"
              style={{
                border: '1.5px dashed var(--border-strong)',
                color: 'var(--text-secondary)',
                background: 'transparent',
              }}
              onClick={handleAddSlide}
            >
              ＋ 슬라이드 추가
            </button>
          </div>

          <div
            className="rounded-xl border overflow-y-auto p-8"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-[18px] font-semibold">슬라이드 {selectedIdx + 1}</span>
                <PrincipleBadge principle={selected.principle} />
              </div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1.5 rounded-lg text-[12px] font-semibold"
                  style={{
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-strong)',
                  }}
                  onClick={() => toast('AI 재생성은 다음 단계에서 연결됩니다')}
                >
                  🔄 재생성
                </button>
                <button
                  className="px-3 py-1.5 rounded-lg text-[12px] font-semibold"
                  style={{
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border)',
                  }}
                  onClick={handleDeleteSlide}
                >
                  🗑️
                </button>
              </div>
            </div>

            <div className="h-px mb-5" style={{ background: 'var(--border)' }} />

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>6원칙 라벨</FieldLabel>
                  <select
                    className="w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none"
                    style={textareaStyle}
                    value={selected.principle}
                    onChange={(e) => {
                      const p = e.target.value as PrincipleKey;
                      editSelected({ principle: p }, { principle: p });
                    }}
                  >
                    {(Object.entries(PRINCIPLES) as [PrincipleKey, typeof PRINCIPLES[PrincipleKey]][]).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.emoji} {v.ko}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel>화자</FieldLabel>
                  <RadioPill
                    options={[
                      ['niece', '조카'],
                      ['uncle', '삼촌'],
                      ['none', '없음'],
                    ]}
                    value={selected.speaker}
                    onChange={(v: Speaker) => editSelected({ speaker: v }, { speaker: v })}
                  />
                </div>
              </div>

              <div>
                <FieldLabel>장면 묘사</FieldLabel>
                <textarea
                  className="w-full px-3 py-2.5 rounded-lg border text-[14px] outline-none resize-none"
                  style={{ ...textareaStyle, minHeight: 80 }}
                  rows={2}
                  value={selected.scene}
                  onChange={(e) =>
                    editSelected({ scene: e.target.value }, { scene: e.target.value })
                  }
                />
              </div>

              <div>
                <FieldLabel>
                  <span className="flex items-center gap-2">
                    메인 텍스트
                    {selected.guards.some((g) => g.kind === 'yellow') && (
                      <span style={{ color: 'var(--status-yellow)' }}>⚠️🟡</span>
                    )}
                    {selected.guards.some((g) => g.kind === 'red') && (
                      <span style={{ color: 'var(--status-red)' }}>⚠️🔴</span>
                    )}
                  </span>
                </FieldLabel>
                <textarea
                  className="w-full px-3.5 py-3 rounded-lg border text-[14px] leading-relaxed outline-none resize-none"
                  style={{
                    background: 'var(--bg-tertiary)',
                    borderColor: 'var(--brand-accent)',
                    color: 'var(--text-primary)',
                    minHeight: 80,
                  }}
                  value={selected.main}
                  onChange={(e) =>
                    editSelected({ main_text: e.target.value }, { main: e.target.value }, true)
                  }
                />
                {selected.guards.length > 0 && (
                  <div
                    className="mt-2 px-3.5 py-2.5 rounded-lg text-[13px] leading-relaxed"
                    style={{ background: 'var(--bg-tertiary)', border: '1px dashed var(--border)' }}
                  >
                    <div className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>
                      미리보기 (옐로우/레드 클릭하면 자동 교체)
                    </div>
                    <GuardedText
                      text={selected.main}
                      guards={selected.guards}
                      onReplace={handleAutoFix}
                    />
                  </div>
                )}
              </div>

              <div>
                <FieldLabel>보조 텍스트</FieldLabel>
                <textarea
                  className="w-full px-3 py-2.5 rounded-lg border text-[14px] outline-none resize-none"
                  style={{ ...textareaStyle, minHeight: 60 }}
                  rows={2}
                  value={selected.sub}
                  onChange={(e) =>
                    editSelected({ sub_text: e.target.value }, { sub: e.target.value })
                  }
                />
              </div>

              <div>
                <FieldLabel>강조 표현 (볼드 처리)</FieldLabel>
                <div className="flex flex-wrap gap-1.5">
                  {selected.emphasis.map((w, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[12px] border"
                      style={{
                        background: 'var(--bg-tertiary)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <b style={{ color: 'var(--brand-accent)' }}>{w}</b>
                      <span
                        className="cursor-pointer text-[10px] transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                        onClick={() => handleRemoveEmphasis(i)}
                      >
                        ✕
                      </span>
                    </span>
                  ))}
                  <button
                    className="px-2 py-1 rounded-md text-[12px] transition-colors"
                    style={{
                      border: '1px dashed var(--border-strong)',
                      color: 'var(--text-secondary)',
                      background: 'transparent',
                    }}
                    onClick={handleAddEmphasis}
                  >
                    ＋ 추가
                  </button>
                </div>
              </div>

              {selected.guards.length > 0 && (
                <div>
                  <FieldLabel>가드레일 경고 ({selected.guards.length})</FieldLabel>
                  <div className="flex flex-col gap-2">
                    {selected.guards.map((g, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-3 py-3 rounded-lg border"
                        style={{
                          borderColor:
                            g.kind === 'red' ? 'var(--status-red)' : 'var(--status-yellow)',
                          background:
                            g.kind === 'red' ? 'var(--red-bg)' : 'var(--yellow-bg)',
                        }}
                      >
                        <div className="flex items-center gap-2 text-[13px]">
                          <span
                            className="font-semibold"
                            style={{
                              color:
                                g.kind === 'red'
                                  ? 'var(--status-red)'
                                  : 'var(--status-yellow)',
                            }}
                          >
                            {g.kind === 'red' ? '🔴 RED' : '🟡 YELLOW'}
                          </span>
                          <span className="font-mono">&quot;{g.word}&quot;</span>
                          {g.suggest && (
                            <>
                              <span style={{ color: 'var(--text-muted)' }}>→</span>
                              <span className="font-mono" style={{ color: 'var(--brand-accent)' }}>
                                &quot;{g.suggest}&quot;
                              </span>
                            </>
                          )}
                        </div>
                        {g.suggest && (
                          <button
                            className="px-3 py-1.5 rounded-md text-[12px] font-semibold"
                            style={{
                              background: 'var(--bg-tertiary)',
                              color: 'var(--text-primary)',
                              border: '1px solid var(--border-strong)',
                            }}
                            onClick={() => handleAutoFix(g.word, g.suggest)}
                          >
                            자동 수정
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
              ⚠️ 광고 심의 위험 {stats.red}개
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
