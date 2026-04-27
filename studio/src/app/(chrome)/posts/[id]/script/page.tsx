'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { SCRIPT_SLIDES } from '@/lib/mock';
import { PRINCIPLES } from '@/lib/principles';
import type { Slide } from '@/lib/mock';
import type { PrincipleKey } from '@/lib/principles';
import { SlideCard } from '@/components/post/SlideCard';
import { GuardrailScore } from '@/components/post/GuardrailScore';
import { PrincipleBadge } from '@/components/post/PrincipleBadge';
import { GuardedText } from '@/components/post/GuardedText';

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

export default function ScriptPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [slides, setSlides] = useState<Slide[]>(SCRIPT_SLIDES.map(s => ({ ...s })));
  const [selectedIdx, setSelectedIdx] = useState(2);
  const [showWarnDialog, setShowWarnDialog] = useState(false);

  const selected = slides[selectedIdx];

  const greenCount = slides.filter(s => !s.guards || s.guards.length === 0).length;
  const yellowCount = slides.reduce((a, s) => a + s.guards.filter(g => g.kind === 'yellow').length, 0);
  const redCount = slides.reduce((a, s) => a + s.guards.filter(g => g.kind === 'red').length, 0);

  const updateSlide = (patch: Partial<Slide>) => {
    setSlides(prev => prev.map((s, i) => (i === selectedIdx ? { ...s, ...patch } : s)));
  };

  const handleAutoFix = (oldWord: string, newWord: string) => {
    const newMain = selected.main.replaceAll(oldWord, newWord);
    const newGuards = selected.guards.filter(g => g.word !== oldWord);
    updateSlide({ main: newMain, guards: newGuards });
  };

  const tryProceed = () => {
    if (redCount > 0) setShowWarnDialog(true);
    else router.push(`/posts/${params.id}/design`);
  };

  const textareaStyle = {
    background: 'var(--bg-tertiary)',
    borderColor: 'var(--border)',
    color: 'var(--text-primary)',
  };

  return (
    <>
      <div
        className="flex flex-col gap-4"
        style={{ height: 'calc(100vh - 56px - 64px)', minHeight: 0 }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[24px]">2️⃣</span>
            <h1 className="text-[24px] font-bold m-0">스크립트 편집</h1>
            <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>{slides.length}컷</span>
          </div>
          <div className="flex gap-2">
            <button
              className="px-4 py-2.5 rounded-lg font-semibold text-[14px] transition-colors"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)' }}
            >
              🔄 전체 재생성
            </button>
            <button
              className="px-4 py-2.5 rounded-lg font-semibold text-[14px] transition-colors"
              style={{ background: 'var(--brand-accent)', color: '#003320' }}
              onClick={tryProceed}
              onMouseOver={e => (e.currentTarget.style.background = 'var(--brand-accent-hover)')}
              onMouseOut={e => (e.currentTarget.style.background = 'var(--brand-accent)')}
            >
              디자인 →
            </button>
          </div>
        </div>

        {/* 가드레일 점수 */}
        <GuardrailScore green={greenCount} yellow={yellowCount} red={redCount} />

        {/* 2컬럼 */}
        <div className="grid gap-4 flex-1 min-h-0" style={{ gridTemplateColumns: '360px 1fr' }}>
          {/* 슬라이드 리스트 */}
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
              onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              ＋ 슬라이드 추가
            </button>
          </div>

          {/* 슬라이드 편집 패널 */}
          <div
            className="rounded-xl border overflow-y-auto p-8"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-[18px] font-semibold">슬라이드 {selectedIdx + 1}</span>
                <PrincipleBadge principle={selected.principle} />
              </div>
              <button
                className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)' }}
              >
                🔄 이 슬라이드만 재생성
              </button>
            </div>

            <div className="h-px mb-5" style={{ background: 'var(--border)' }} />

            <div className="flex flex-col gap-4">
              {/* 6원칙 + 화자 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>6원칙 라벨</FieldLabel>
                  <select
                    className="w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none transition-colors"
                    style={textareaStyle}
                    value={selected.principle}
                    onChange={e => updateSlide({ principle: e.target.value as PrincipleKey })}
                  >
                    {(Object.entries(PRINCIPLES) as [PrincipleKey, typeof PRINCIPLES[PrincipleKey]][]).map(([k, v]) => (
                      <option key={k} value={k}>{v.emoji} {v.ko}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel>화자</FieldLabel>
                  <RadioPill
                    options={[['niece', '조카'], ['uncle', '삼촌'], ['none', '없음']]}
                    value={selected.speaker}
                    onChange={v => updateSlide({ speaker: v })}
                  />
                </div>
              </div>

              {/* 장면 묘사 */}
              <div>
                <FieldLabel>장면 묘사</FieldLabel>
                <textarea
                  className="w-full px-3 py-2.5 rounded-lg border text-[14px] outline-none resize-none transition-colors"
                  style={{ ...textareaStyle, minHeight: 80 }}
                  rows={2}
                  value={selected.scene}
                  onChange={e => updateSlide({ scene: e.target.value })}
                  onFocus={e => (e.target.style.borderColor = 'var(--brand-accent)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>

              {/* 메인 텍스트 with 가드레일 */}
              <div>
                <FieldLabel>
                  <span className="flex items-center gap-2">
                    메인 텍스트
                    {selected.guards.some(g => g.kind === 'yellow') && (
                      <span style={{ color: 'var(--status-yellow)' }}>⚠️🟡</span>
                    )}
                    {selected.guards.some(g => g.kind === 'red') && (
                      <span style={{ color: 'var(--status-red)' }}>⚠️🔴</span>
                    )}
                  </span>
                </FieldLabel>
                <div
                  className="rounded-lg border px-3.5 py-3 text-[14px] leading-relaxed min-h-[80px]"
                  style={{
                    background: 'var(--bg-tertiary)',
                    borderColor: 'var(--brand-accent)',
                  }}
                >
                  <GuardedText
                    text={selected.main}
                    guards={selected.guards}
                    onReplace={handleAutoFix}
                  />
                </div>
                <p className="text-[12px] mt-1.5 m-0" style={{ color: 'var(--text-muted)' }}>
                  옐로우/레드 단어를 클릭하면 자동 교체 제안
                </p>
              </div>

              {/* 보조 텍스트 */}
              <div>
                <FieldLabel>보조 텍스트</FieldLabel>
                <textarea
                  className="w-full px-3 py-2.5 rounded-lg border text-[14px] outline-none resize-none transition-colors"
                  style={{ ...textareaStyle, minHeight: 60 }}
                  rows={2}
                  value={selected.sub}
                  onChange={e => updateSlide({ sub: e.target.value })}
                  onFocus={e => (e.target.style.borderColor = 'var(--brand-accent)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>

              {/* 강조 표현 */}
              <div>
                <FieldLabel>강조 표현 (볼드 처리)</FieldLabel>
                <div className="flex flex-wrap gap-1.5">
                  {selected.emphasis.map((w, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[12px] border"
                      style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    >
                      <b style={{ color: 'var(--brand-accent)' }}>{w}</b>
                      <span
                        className="cursor-pointer text-[10px] transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                        onClick={() => updateSlide({ emphasis: selected.emphasis.filter((_, j) => j !== i) })}
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
              </div>

              {/* 가드레일 경고 패널 */}
              {selected.guards.length > 0 && (
                <div>
                  <FieldLabel>가드레일 경고 ({selected.guards.length})</FieldLabel>
                  <div className="flex flex-col gap-2">
                    {selected.guards.map((g, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-3 py-3 rounded-lg border"
                        style={{
                          borderColor: g.kind === 'red' ? 'var(--status-red)' : 'var(--status-yellow)',
                          background: g.kind === 'red' ? 'var(--red-bg)' : 'var(--yellow-bg)',
                        }}
                      >
                        <div className="flex items-center gap-2 text-[13px]">
                          <span
                            className="font-semibold"
                            style={{ color: g.kind === 'red' ? 'var(--status-red)' : 'var(--status-yellow)' }}
                          >
                            {g.kind === 'red' ? '🔴 RED' : '🟡 YELLOW'}
                          </span>
                          <span className="font-mono">&quot;{g.word}&quot;</span>
                          <span style={{ color: 'var(--text-muted)' }}>→</span>
                          <span className="font-mono" style={{ color: 'var(--brand-accent)' }}>&quot;{g.suggest}&quot;</span>
                        </div>
                        <button
                          className="px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors"
                          style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)' }}
                          onClick={() => handleAutoFix(g.word, g.suggest)}
                        >
                          자동 수정
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 레드 경고 다이얼로그 */}
      {showWarnDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowWarnDialog(false)}
        >
          <div
            className="p-7 rounded-2xl border"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', width: 460 }}
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-[24px] font-bold m-0 mb-3" style={{ color: 'var(--status-red)' }}>
              ⚠️ 광고 심의 위험 {redCount}개
            </h2>
            <p className="text-[14px] mb-5" style={{ color: 'var(--text-secondary)' }}>
              레드 가드레일에 걸린 표현이 남아 있어요. 그대로 진행하시겠어요?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                className="px-4 py-2.5 rounded-lg font-semibold text-[14px] transition-colors"
                style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid transparent' }}
                onClick={() => setShowWarnDialog(false)}
                onMouseOver={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
              >
                돌아가서 수정
              </button>
              <button
                className="px-4 py-2.5 rounded-lg font-semibold text-[14px] transition-colors"
                style={{
                  background: 'transparent',
                  color: 'var(--status-red)',
                  border: '1px solid rgba(255,68,68,0.3)',
                }}
                onClick={() => {
                  setShowWarnDialog(false);
                  router.push(`/posts/${params.id}/design`);
                }}
                onMouseOver={e => (e.currentTarget.style.background = 'var(--red-bg)')}
                onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
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
