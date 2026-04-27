'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SERIES, PERSONAS } from '@/lib/mock';
import type { Series, PersonaKey } from '@/lib/mock';

const inputCls = 'w-full px-3 py-2.5 rounded-lg border text-[14px] outline-none transition-colors resize-none';
const inputStyle = { background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' };

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[13px] font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
      {children}
      {required && <span className="ml-1" style={{ color: 'var(--brand-accent)' }}>*</span>}
    </label>
  );
}

function RadioGroup<T extends string>({
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

export default function NewPostPage() {
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [series, setSeries] = useState<Series>('A');
  const [persona, setPersona] = useState<PersonaKey>('30s_office');
  const [facts, setFacts] = useState('');
  const [tone, setTone] = useState<'soft' | 'normal' | 'strong'>('normal');
  const [slideCount, setSlideCount] = useState(9);
  const [cta, setCta] = useState('save');
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [keywords, setKeywords] = useState('');
  const [emphasizeNoSell, setEmphasizeNoSell] = useState(true);
  const [refs, setRefs] = useState('');
  const [loading, setLoading] = useState(false);

  const canGenerate = topic.trim() && facts.trim();

  const handleGenerate = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push('/posts/p1/script');
    }, 1400);
  };

  const selectCls = 'w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none transition-colors';

  return (
    <>
      <div className="flex flex-col gap-6" style={{ maxWidth: 720, margin: '0 auto' }}>
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[24px]">1️⃣</span>
            <h1 className="text-[32px] font-bold m-0 tracking-tight">주제 입력</h1>
          </div>
          <p className="text-sm m-0" style={{ color: 'var(--text-secondary)' }}>
            한 줄 주제와 핵심 팩트만 있으면 AI가 6원칙으로 9컷을 짜줍니다
          </p>
        </div>

        {/* 필수 정보 */}
        <div
          className="p-8 rounded-xl border flex flex-col gap-5"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
        >
          <div className="text-[18px] font-semibold mb-1">필수 정보</div>

          <div>
            <FieldLabel required>주제 한 줄</FieldLabel>
            <textarea
              className={inputCls}
              style={{ ...inputStyle, minHeight: 60 }}
              rows={2}
              placeholder="예: 암치료비가 비싸다는데 얼마나?"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              onFocus={e => (e.target.style.borderColor = 'var(--brand-accent)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel required>시리즈</FieldLabel>
              <select
                className={selectCls}
                style={inputStyle}
                value={series}
                onChange={e => setSeries(e.target.value as Series)}
              >
                {(Object.entries(SERIES) as [Series, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel required>페르소나</FieldLabel>
              <select
                className={selectCls}
                style={inputStyle}
                value={persona}
                onChange={e => setPersona(e.target.value as PersonaKey)}
              >
                {(Object.entries(PERSONAS) as [PersonaKey, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <FieldLabel required>핵심 팩트</FieldLabel>
            <textarea
              className={inputCls}
              style={{ ...inputStyle, minHeight: 120 }}
              rows={5}
              placeholder="이 게시물에서 다룰 정확한 보장 구조·수치·법령을 적어주세요. AI는 이 범위 안에서만 작성합니다."
              value={facts}
              onChange={e => setFacts(e.target.value)}
              onFocus={e => (e.target.style.borderColor = 'var(--brand-accent)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
            <p className="text-[12px] mt-1.5 m-0" style={{ color: 'var(--text-muted)' }}>
              AI는 이 팩트 범위 밖의 수치를 만들어내지 않아요
            </p>
          </div>

          <div>
            <FieldLabel required>톤 강도</FieldLabel>
            <RadioGroup
              options={[['soft', '부드러움'], ['normal', '보통'], ['strong', '단호함']]}
              value={tone}
              onChange={setTone}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>슬라이드 수</FieldLabel>
              <select className={selectCls} style={inputStyle} value={slideCount} onChange={e => setSlideCount(Number(e.target.value))}>
                <option value={7}>7컷</option>
                <option value={9}>9컷</option>
                <option value={11}>11컷</option>
              </select>
            </div>
            <div>
              <FieldLabel>CTA</FieldLabel>
              <select className={selectCls} style={inputStyle} value={cta} onChange={e => setCta(e.target.value)}>
                <option value="save">저장 유도</option>
                <option value="share">공유 유도</option>
                <option value="dm">DM 문의</option>
                <option value="link">링크 클릭</option>
              </select>
            </div>
          </div>
        </div>

        {/* 옵션 아코디언 */}
        <div
          className="rounded-xl border overflow-hidden"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
        >
          <button
            className="w-full flex items-center justify-between px-5 py-5 text-[16px] font-semibold transition-colors"
            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}
            onClick={() => setOptionsOpen(o => !o)}
          >
            <span>{optionsOpen ? '▾' : '▸'} 옵션 (선택)</span>
            <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
              {optionsOpen ? '접기' : '펼치기'}
            </span>
          </button>
          {optionsOpen && (
            <div className="flex flex-col gap-4 px-6 pb-6">
              <div>
                <FieldLabel>핵심 키워드</FieldLabel>
                <input
                  className={inputCls}
                  style={inputStyle}
                  placeholder="쉼표로 구분 (예: 비급여, 1세대실손)"
                  value={keywords}
                  onChange={e => setKeywords(e.target.value)}
                  onFocus={e => (e.target.style.borderColor = 'var(--brand-accent)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded accent-[var(--brand-accent)]"
                  checked={emphasizeNoSell}
                  onChange={e => setEmphasizeNoSell(e.target.checked)}
                />
                <span className="text-[14px]">"안 파는 설계사" 페르소나 강조</span>
              </label>
              <div>
                <FieldLabel>참고 자료</FieldLabel>
                <textarea
                  className={inputCls}
                  style={inputStyle}
                  rows={3}
                  placeholder="기사 링크, 약관 발췌, 메모 등 자유 입력"
                  value={refs}
                  onChange={e => setRefs(e.target.value)}
                  onFocus={e => (e.target.style.borderColor = 'var(--brand-accent)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="flex gap-2 justify-end">
          <button
            className="px-4 py-2.5 rounded-lg font-semibold text-[14px] transition-colors"
            style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid transparent' }}
            onClick={() => router.push('/')}
            onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            ← 취소
          </button>
          <button
            className="px-4 py-2.5 rounded-lg font-semibold text-[14px] transition-colors"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)' }}
          >
            📋 템플릿
          </button>
          <button
            className="px-4 py-2.5 rounded-lg font-semibold text-[14px] transition-colors disabled:opacity-40"
            style={{ background: 'var(--brand-accent)', color: '#003320' }}
            disabled={!canGenerate}
            onClick={handleGenerate}
            onMouseOver={e => { if (canGenerate) e.currentTarget.style.background = 'var(--brand-accent-hover)'; }}
            onMouseOut={e => (e.currentTarget.style.background = 'var(--brand-accent)')}
          >
            스크립트 생성 →
          </button>
        </div>
      </div>

      {/* 로딩 모달 */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div
            className="flex flex-col items-center text-center p-7 rounded-2xl border"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', width: 460 }}
          >
            <div className="text-[32px] mb-2">🤖</div>
            <h2 className="text-[24px] font-bold m-0 mb-2">AI가 6원칙 적용 중...</h2>
            <p className="text-sm m-0 mb-6" style={{ color: 'var(--text-secondary)' }}>
              {slideCount}컷 시나리오를 짜고 가드레일 통과 여부를 검사합니다
            </p>
            <div
              className="w-full h-1 rounded-full overflow-hidden"
              style={{ background: 'var(--bg-tertiary)' }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: '40%',
                  background: 'var(--brand-accent)',
                  animation: 'loadingSlide 1.4s ease-in-out infinite',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
