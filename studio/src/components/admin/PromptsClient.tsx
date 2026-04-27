'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';

const VARIABLES = ['{{topic}}', '{{persona}}', '{{facts}}', '{{tone}}', '{{slide_count}}', '{{cta}}'];

export type PromptVersionRow = {
  id: string;
  version: string;
  body: string;
  author: string | null;
  created_at: string;
};

function highlightVars(text: string) {
  const parts = text.split(/(\{\{[^}]+\}\})/g);
  return parts.map((part, i) =>
    /^\{\{[^}]+\}\}$/.test(part) ? (
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
    ),
  );
}

export function PromptsClient({
  versions,
  activeVersionId,
}: {
  versions: PromptVersionRow[];
  activeVersionId: string | null;
}) {
  const [selectedId, setSelectedId] = useState<string>(
    activeVersionId ?? versions[0]?.id ?? '',
  );
  const selected = useMemo(
    () => versions.find((v) => v.id === selectedId) ?? versions[0] ?? null,
    [selectedId, versions],
  );
  const [body, setBody] = useState(selected?.body ?? '');
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState(false);

  const onSelectVersion = (id: string) => {
    setSelectedId(id);
    const v = versions.find((x) => x.id === id);
    if (v) setBody(v.body);
    setEditing(false);
  };

  if (!selected) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-[32px] font-bold m-0 mb-1 tracking-tight">🛠️ 프롬프트 관리</h1>
        <p className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
          등록된 프롬프트가 없습니다. seed.sql을 실행해주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
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
            onClick={() => setPreview((p) => !p)}
          >
            {preview ? '✏️ 편집 모드' : '👁️ 프리뷰'}
          </button>
          {!editing ? (
            <button
              className="px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors"
              style={{ background: 'var(--brand-accent)', color: '#003320', border: 'none' }}
              onClick={() => {
                setEditing(true);
                setPreview(false);
              }}
            >
              ✏️ 편집
            </button>
          ) : (
            <>
              <button
                className="px-3 py-2 rounded-lg text-[13px] font-medium transition-colors"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                onClick={() => {
                  setEditing(false);
                  setBody(selected.body);
                }}
              >
                취소
              </button>
              <button
                className="px-3 py-2 rounded-lg text-[13px] font-semibold transition-colors"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)' }}
                onClick={() => toast('저장/발행은 다음 단계에서 연결됩니다')}
              >
                저장
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6" style={{ gridTemplateColumns: '220px 1fr' }}>
        <div
          className="rounded-xl border p-4 flex flex-col gap-2 h-fit"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
        >
          <div className="text-[13px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
            버전 히스토리
          </div>
          {versions.map((v) => (
            <button
              key={v.id}
              className="w-full text-left px-3 py-2.5 rounded-lg transition-colors flex flex-col gap-0.5"
              style={{
                background: selectedId === v.id ? 'var(--bg-tertiary)' : 'transparent',
                border: selectedId === v.id ? '1px solid var(--border-strong)' : '1px solid transparent',
              }}
              onClick={() => onSelectVersion(v.id)}
            >
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {v.version}
                </span>
                {v.id === activeVersionId && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                    style={{
                      background: 'var(--brand-accent-bg)',
                      color: 'var(--brand-accent)',
                      border: '1px solid var(--brand-accent)',
                    }}
                  >
                    현재
                  </span>
                )}
              </div>
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                {new Date(v.created_at).toISOString().slice(0, 10)}
              </span>
              {v.author && (
                <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                  {v.author}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <div
            className="p-4 rounded-xl border flex flex-wrap gap-2 items-center"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
          >
            <span className="text-[12px] font-semibold mr-1" style={{ color: 'var(--text-muted)' }}>
              사용 가능 변수:
            </span>
            {VARIABLES.map((v) => (
              <span
                key={v}
                className="text-[12px] px-2 py-1 rounded-md font-mono cursor-pointer transition-colors"
                style={{
                  background: 'var(--brand-accent-bg)',
                  color: 'var(--brand-accent)',
                  border: '1px solid var(--brand-accent)',
                }}
                onClick={() => {
                  if (editing) {
                    setBody((b) => b + '\n' + v);
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
                onChange={(e) => setBody(e.target.value)}
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

          <div
            className="flex items-center gap-6 p-4 rounded-xl border"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
          >
            <div className="flex flex-col">
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                추정 토큰
              </span>
              <span className="text-[18px] font-bold" style={{ color: 'var(--text-primary)' }}>
                ~{Math.round(body.length / 4)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                변수 수
              </span>
              <span className="text-[18px] font-bold" style={{ color: 'var(--text-primary)' }}>
                {VARIABLES.filter((v) => body.includes(v)).length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
