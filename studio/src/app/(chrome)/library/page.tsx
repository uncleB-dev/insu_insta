'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { LIBRARY_PHOTOS } from '@/lib/mock';

type Tab = 'photos' | 'templates';

const TEMPLATE_LAYOUTS = [
  { id: 'bold', label: '볼드 텍스트', emoji: '🅱️', desc: '큰 텍스트 중심' },
  { id: 'split', label: '좌우 분할', emoji: '◧', desc: '이미지 + 텍스트' },
  { id: 'minimal', label: '미니멀', emoji: '◻', desc: '여백 중심' },
  { id: 'data', label: '데이터 카드', emoji: '📊', desc: '숫자·통계 강조' },
  { id: 'quote', label: '인용구', emoji: '❝', desc: '짧은 메시지' },
  { id: 'list', label: '리스트형', emoji: '☰', desc: '3·5항목 정리' },
];

const CATEGORIES = ['전체', '업로드', 'Unsplash', '라이브러리'];

const SOURCE_TO_CAT: Record<string, string> = {
  upload: '업로드',
  unsplash: 'Unsplash',
  library: '라이브러리',
};

export default function LibraryPage() {
  const [tab, setTab] = useState<Tab>('photos');
  const [category, setCategory] = useState('전체');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [uploadHover, setUploadHover] = useState(false);

  const filtered = LIBRARY_PHOTOS.filter(p => {
    if (category !== '전체' && SOURCE_TO_CAT[p.source] !== category) return false;
    return true;
  });

  const handleSelect = (id: string) => {
    setSelected(s => s === id ? null : id);
  };

  const handleUse = () => {
    if (!selected) return;
    toast('✓ 배경 사진 적용 완료');
    setSelected(null);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[32px] font-bold m-0 mb-1 tracking-tight">🖼️ 라이브러리</h1>
          <p className="text-[12px] m-0" style={{ color: 'var(--text-secondary)' }}>
            배경 사진 및 슬라이드 템플릿 관리
          </p>
        </div>
        <button
          className="px-4 py-2.5 rounded-lg font-semibold text-[14px] transition-colors"
          style={{ background: 'var(--brand-accent)', color: '#003320', border: 'none' }}
          onMouseOver={e => (e.currentTarget.style.background = 'var(--brand-accent-hover)')}
          onMouseOut={e => (e.currentTarget.style.background = 'var(--brand-accent)')}
          onClick={() => toast('업로드 기능은 준비 중입니다')}
        >
          ＋ 업로드
        </button>
      </div>

      {/* 탭 */}
      <div
        className="flex gap-1 p-1 rounded-xl w-fit"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
      >
        {(['photos', 'templates'] as Tab[]).map(t => (
          <button
            key={t}
            className="px-5 py-2 rounded-lg text-[13px] font-semibold transition-colors"
            style={{
              background: tab === t ? 'var(--bg-tertiary)' : 'transparent',
              color: tab === t ? 'var(--text-primary)' : 'var(--text-secondary)',
              border: tab === t ? '1px solid var(--border-strong)' : '1px solid transparent',
            }}
            onClick={() => setTab(t)}
          >
            {t === 'photos' ? '📷 배경 사진' : '🎨 템플릿'}
          </button>
        ))}
      </div>

      {tab === 'photos' && (
        <>
          {/* 필터 */}
          <div
            className="flex flex-col gap-3 p-5 rounded-xl border"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
          >
            <input
              className="w-full px-3 py-2.5 rounded-lg border text-[14px] outline-none transition-colors"
              style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              placeholder="🔍 소스 검색..."
              value={q}
              onChange={e => setQ(e.target.value)}
              onFocus={e => (e.target.style.borderColor = 'var(--brand-accent)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors"
                  style={{
                    background: category === cat ? 'var(--brand-accent-bg)' : 'var(--bg-tertiary)',
                    color: category === cat ? 'var(--brand-accent)' : 'var(--text-secondary)',
                    border: `1px solid ${category === cat ? 'var(--brand-accent)' : 'var(--border)'}`,
                  }}
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 사진 그리드 */}
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
            {/* 업로드 존 */}
            <div
              className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all"
              style={{
                aspectRatio: '1/1',
                borderColor: uploadHover ? 'var(--brand-accent)' : 'var(--border-strong)',
                background: uploadHover ? 'var(--brand-accent-bg)' : 'transparent',
              }}
              onMouseEnter={() => setUploadHover(true)}
              onMouseLeave={() => setUploadHover(false)}
              onClick={() => toast('업로드 기능은 준비 중입니다')}
            >
              <span className="text-[24px] mb-1">＋</span>
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>업로드</span>
            </div>

            {filtered.map(photo => (
              <div
                key={photo.id}
                className="relative rounded-xl overflow-hidden cursor-pointer transition-all"
                style={{
                  aspectRatio: '1/1',
                  backgroundImage: `url(${photo.src})`,
                  backgroundSize: 'cover',
                  outline: selected === photo.id ? '3px solid var(--brand-accent)' : '3px solid transparent',
                  outlineOffset: '2px',
                }}
                onClick={() => handleSelect(photo.id)}
              >
                {selected === photo.id && (
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ background: 'rgba(0,255,136,0.2)' }}
                  >
                    <span className="text-[28px]">✓</span>
                  </div>
                )}
                <div
                  className="absolute bottom-0 left-0 right-0 p-2 flex flex-wrap gap-1 opacity-0 hover:opacity-100 transition-opacity"
                  style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}
                >
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
                  >
                    {SOURCE_TO_CAT[photo.source]}
                  </span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
                  >
                    {photo.uses}회 사용
                  </span>
                </div>
              </div>
            ))}
          </div>

          {selected && (
            <div
              className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3 rounded-2xl border z-40"
              style={{ background: 'var(--bg-secondary)', borderColor: 'var(--brand-accent)', boxShadow: 'var(--shadow-pop)' }}
            >
              <span className="text-[14px]" style={{ color: 'var(--text-primary)' }}>1장 선택됨</span>
              <button
                className="px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors"
                style={{ background: 'var(--brand-accent)', color: '#003320', border: 'none' }}
                onClick={handleUse}
              >
                디자인에 적용
              </button>
              <button
                className="px-3 py-2 rounded-lg text-[13px] transition-colors"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                onClick={() => setSelected(null)}
              >
                취소
              </button>
            </div>
          )}
        </>
      )}

      {tab === 'templates' && (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {TEMPLATE_LAYOUTS.map(tpl => (
            <div
              key={tpl.id}
              className="rounded-xl border p-6 flex flex-col gap-3 cursor-pointer transition-all"
              style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
              onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--brand-accent)')}
              onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              onClick={() => toast(`'${tpl.label}' 템플릿 적용됨`)}
            >
              <div className="text-[40px]">{tpl.emoji}</div>
              <div>
                <div className="text-[16px] font-semibold mb-0.5">{tpl.label}</div>
                <div className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>{tpl.desc}</div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {['후킹', '문제점', '해결책'].map(p => (
                  <span
                    key={p}
                    className="text-[11px] px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
