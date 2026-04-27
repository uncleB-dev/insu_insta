'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { PROMPT_VERSIONS, PROMPT_BODY } from '@/lib/mock';

const VARIABLES = ['{{topic}}', '{{persona}}', '{{facts}}', '{{tone}}', '{{slide_count}}', '{{cta}}'];

function highlightVars(text: string) {
  const parts = text.split(/({{[^}]+}})/g);
  return parts.map((part, i) =>
    VARIABLES.includes(part) ? (
      <mark
        key={i}
        style={{
          background: 'var(--brand-accent-bg)',
          color: 'var(--brand-accent)',
          borderRadius: 4,
          padding: '0 3px',
          border: '1px solid var(--brand-accent)',
          fontWeight: 600,
        }}
      >
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export default function PromptsPage() {
  const [activeVersion, setActiveVersion] = useState(
    PROMPT_VERSIONS.find(v => v.active)?.v ?? PROMPT_VERSIONS[0].v
  );
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(PROMPT_BODY);
  const [preview, setPreview] = useState(false);
  const [showPublish, setShowPublish] = useState(false);

  const handleSave = () => {
    setEditing(false);
    toast('✓ 프롬프트 저장됨 (미발행 상태)');
  };

  const handlePublish = () => {
    setShowPublish(false);
    toast('✓ 프롬프트 발행 완료');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[32px] font-bold m-0 mb-1 tracking-tight">🛠️ 프롬프트 관리</h1>
          <p className="text-[12px] m-0" style={{ color: 'var(--text-secondary)' }}>
            AI 스크립트 생성 프롬프트 편집 및 버전 관리
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="px-3 py-2 rounded-lg text-[13px] font-medium transition-colors"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            onClick={() => setPreview(p => !p)}
          >
            {preview ? '✏️ 편집 모드' : '👁️ 프리뷰'}
          </button>
          {!editing ? (
            <button
              className="px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors"
              style={{ background: 'var(--brand-accent)', color: '#003320', border: 'none' }}
              onClick={() => { setEditing(true); setPreview(false); }}
              onMouseOver={e => (e.currentTarget.style.background = 'var(--brand-accent-hover)')}
              onMouseOut={e => (e.currentTarget.style.background = 'var(--brand-accent)')}
            >
              ✏️ 편집
            </button>
          ) : (
            <>
              <button
                className="px-3 py-2 rounded-lg text-[13px] font-medium transition-colors"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                onClick={() => { setEditing(false); setBody(PROMPT_BODY); }}
              >
                취소
              </button>
              <button
                className="px-3 py-2 rounded-lg text-[13px] font-semibold transition-colors"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)' }}
                onClick={handleSave}
              >
                저장
              </button>
              <button
                className="px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors"
                style={{ background: 'var(--brand-accent)', color: '#003320', border: 'none' }}
                onClick={() => setShowPublish(true)}
                onMouseOver={e => (e.currentTarget.style.background = 'var(--brand-accent-hover)')}
                onMouseOut={e => (e.currentTarget.style.background = 'var(--brand-accent)')}
              >
                🚀 발행
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6" style={{ gridTemplateColumns: '220px 1fr' }}>
        {/* 버전 히스토리 */}
        <div
          className="rounded-xl border p-4 flex flex-col gap-2 h-fit"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
        >
          <div className="text-[13px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
            버전 히스토리
          </div>
          {PROMPT_VERSIONS.map(ver => (
            <button
              key={ver.v}
              className="w-full text-left px-3 py-2.5 rounded-lg transition-colors flex flex-col gap-0.5"
              style={{
                background: activeVersion === ver.v ? 'var(--bg-tertiary)' : 'transparent',
                border: activeVersion === ver.v ? '1px solid var(--border-strong)' : '1px solid transparent',
              }}
              onClick={() => setActiveVersion(ver.v)}
            >
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {ver.v}
                </span>
                {ver.active && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                    style={{ background: 'var(--brand-accent-bg)', color: 'var(--brand-accent)', border: '1px solid var(--brand-accent)' }}
                  >
                    현재
                  </span>
                )}
              </div>
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{ver.date}</span>
              <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{ver.author}</span>
            </button>
          ))}
        </div>

        {/* 에디터 / 프리뷰 */}
        <div className="flex flex-col gap-4">
          {/* 변수 참조 */}
          <div
            className="p-4 rounded-xl border flex flex-wrap gap-2 items-center"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
          >
            <span className="text-[12px] font-semibold mr-1" style={{ color: 'var(--text-muted)' }}>사용 가능 변수:</span>
            {VARIABLES.map(v => (
              <span
                key={v}
                className="text-[12px] px-2 py-1 rounded-md font-mono cursor-pointer transition-colors"
                style={{ background: 'var(--brand-accent-bg)', color: 'var(--brand-accent)', border: '1px solid var(--brand-accent)' }}
                onClick={() => {
                  if (editing) {
                    setBody(b => b + '\n' + v);
                    toast(`${v} 삽입됨`);
                  }
                }}
              >
                {v}
              </span>
            ))}
          </div>

          <div
            className="rounded-xl border overflow-hidden"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
          >
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: 'var(--border)' }}
            >
              <span className="text-[13px] font-semibold">
                {preview ? '프리뷰 (변수 하이라이트)' : '프롬프트 본문'}
              </span>
              <span className="text-[12px]" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {body.length}자
              </span>
            </div>

            {preview ? (
              <div
                className="p-5 text-[13px] leading-relaxed whitespace-pre-wrap font-mono"
                style={{ color: 'var(--text-primary)', minHeight: 400, fontFamily: 'var(--font-mono)' }}
              >
                {highlightVars(body)}
              </div>
            ) : editing ? (
              <textarea
                className="w-full p-5 text-[13px] leading-relaxed outline-none resize-none font-mono"
                style={{
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  border: 'none',
                  minHeight: 400,
                  fontFamily: 'var(--font-mono)',
                }}
                value={body}
                onChange={e => setBody(e.target.value)}
              />
            ) : (
              <div
                className="p-5 text-[13px] leading-relaxed whitespace-pre-wrap font-mono"
                style={{ color: 'var(--text-primary)', minHeight: 400, fontFamily: 'var(--font-mono)' }}
              >
                {body}
              </div>
            )}
          </div>

          {/* 토큰 추정 */}
          <div
            className="flex items-center gap-6 p-4 rounded-xl border"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
          >
            <div className="flex flex-col">
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>추정 토큰</span>
              <span className="text-[18px] font-bold" style={{ color: 'var(--text-primary)' }}>
                ~{Math.round(body.length / 4)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>예상 비용 / 호출</span>
              <span className="text-[18px] font-bold" style={{ color: 'var(--brand-accent)' }}>
                ~$0.{String(Math.round(body.length / 4 * 3 / 10)).padStart(3, '0')}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>변수 수</span>
              <span className="text-[18px] font-bold" style={{ color: 'var(--text-primary)' }}>
                {VARIABLES.filter(v => body.includes(v)).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 발행 확인 모달 */}
      {showPublish && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowPublish(false)}
        >
          <div
            className="flex flex-col gap-4 p-7 rounded-2xl border"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', width: 420 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="text-[20px] font-bold">🚀 프롬프트 발행</div>
            <p className="text-[14px] m-0" style={{ color: 'var(--text-secondary)' }}>
              이 버전을 현재 운영 프롬프트로 전환합니다. 즉시 적용되며 모든 새 게시물 생성에 사용됩니다.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                className="px-4 py-2 rounded-lg text-[14px] font-medium"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                onClick={() => setShowPublish(false)}
              >
                취소
              </button>
              <button
                className="px-4 py-2 rounded-lg text-[14px] font-semibold"
                style={{ background: 'var(--brand-accent)', color: '#003320', border: 'none' }}
                onClick={handlePublish}
              >
                발행
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
