'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { GUARDRAIL_RULES } from '@/lib/mock';
import type { GuardrailRule, GuardKind, RuleKind } from '@/lib/mock';

const LEVEL_STYLE: Record<GuardKind, { bg: string; color: string; label: string }> = {
  red:    { bg: 'rgba(255,77,109,0.15)', color: 'var(--status-red)',    label: '🔴 금지' },
  yellow: { bg: 'rgba(255,180,0,0.15)',  color: 'var(--status-yellow)', label: '🟡 경고' },
  green:  { bg: 'rgba(0,255,136,0.1)',   color: 'var(--brand-accent)',  label: '🟢 안전' },
};

const EMPTY_RULE: Omit<GuardrailRule, 'id'> = {
  level: 'yellow',
  kind: 'word',
  pattern: '',
  message: '',
  replace: '',
  active: true,
};

export default function GuardrailsPage() {
  const [rules, setRules] = useState<GuardrailRule[]>(GUARDRAIL_RULES);
  const [filterLevel, setFilterLevel] = useState<'all' | GuardKind>('all');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [q, setQ] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState<Omit<GuardrailRule, 'id'>>(EMPTY_RULE);
  const [editId, setEditId] = useState<string | null>(null);

  const filtered = rules.filter(r => {
    if (filterLevel !== 'all' && r.level !== filterLevel) return false;
    if (filterActive === 'active' && !r.active) return false;
    if (filterActive === 'inactive' && r.active) return false;
    if (q && !r.pattern.includes(q) && !r.message.includes(q)) return false;
    return true;
  });

  const toggleActive = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
    toast('✓ 규칙 상태 변경됨');
  };

  const deleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
    toast('규칙 삭제됨');
  };

  const handleAdd = () => {
    if (!draft.pattern) { toast.error('패턴을 입력해주세요'); return; }
    const newRule: GuardrailRule = {
      ...draft,
      id: `rule_${Date.now()}`,
    };
    setRules(prev => [newRule, ...prev]);
    setDraft(EMPTY_RULE);
    setShowAdd(false);
    toast('✓ 규칙 추가됨');
  };

  const counts = {
    red: rules.filter(r => r.level === 'red').length,
    yellow: rules.filter(r => r.level === 'yellow').length,
    green: rules.filter(r => r.level === 'green').length,
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[32px] font-bold m-0 mb-1 tracking-tight">⚖️ 가드레일 관리</h1>
          <p className="text-[12px] m-0" style={{ color: 'var(--text-secondary)' }}>
            스크립트 규정 위반 감지 규칙 관리
          </p>
        </div>
        <button
          className="px-4 py-2.5 rounded-lg font-semibold text-[14px] transition-colors"
          style={{ background: 'var(--brand-accent)', color: '#003320', border: 'none' }}
          onClick={() => { setShowAdd(true); setDraft(EMPTY_RULE); }}
          onMouseOver={e => (e.currentTarget.style.background = 'var(--brand-accent-hover)')}
          onMouseOut={e => (e.currentTarget.style.background = 'var(--brand-accent)')}
        >
          ＋ 규칙 추가
        </button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-4">
        {(['red', 'yellow', 'green'] as GuardKind[]).map(level => (
          <div
            key={level}
            className="rounded-xl border p-5"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
          >
            <div className="text-[13px] mb-1" style={{ color: 'var(--text-muted)' }}>
              {LEVEL_STYLE[level].label}
            </div>
            <div className="text-[32px] font-bold" style={{ color: LEVEL_STYLE[level].color }}>
              {counts[level]}
            </div>
            <div className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
              활성 {rules.filter(r => r.level === level && r.active).length}개
            </div>
          </div>
        ))}
      </div>

      {/* 필터 */}
      <div
        className="flex flex-col gap-3 p-5 rounded-xl border"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
      >
        <input
          className="w-full px-3 py-2.5 rounded-lg border text-[14px] outline-none transition-colors"
          style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          placeholder="🔍 패턴·메시지 검색..."
          value={q}
          onChange={e => setQ(e.target.value)}
          onFocus={e => (e.target.style.borderColor = 'var(--brand-accent)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')}
        />
        <div className="flex gap-2 flex-wrap">
          {(['all', 'red', 'yellow', 'green'] as const).map(lv => (
            <button
              key={lv}
              className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors"
              style={{
                background: filterLevel === lv ? 'var(--bg-tertiary)' : 'transparent',
                color: filterLevel === lv ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: filterLevel === lv ? '1px solid var(--border-strong)' : '1px solid var(--border)',
              }}
              onClick={() => setFilterLevel(lv)}
            >
              {lv === 'all' ? '전체' : LEVEL_STYLE[lv].label}
            </button>
          ))}
          <div className="w-px mx-1" style={{ background: 'var(--border)' }} />
          {(['all', 'active', 'inactive'] as const).map(af => (
            <button
              key={af}
              className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors"
              style={{
                background: filterActive === af ? 'var(--bg-tertiary)' : 'transparent',
                color: filterActive === af ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: filterActive === af ? '1px solid var(--border-strong)' : '1px solid var(--border)',
              }}
              onClick={() => setFilterActive(af)}
            >
              {af === 'all' ? '전체' : af === 'active' ? '활성' : '비활성'}
            </button>
          ))}
          <span className="ml-auto text-[12px] self-center" style={{ color: 'var(--text-muted)' }}>
            {filtered.length}개
          </span>
        </div>
      </div>

      {/* 규칙 테이블 */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
      >
        <div
          className="grid text-[12px] font-semibold px-4 py-3 border-b"
          style={{
            gridTemplateColumns: '90px 60px 1fr 1fr 1fr 80px 80px',
            color: 'var(--text-muted)',
            borderColor: 'var(--border)',
          }}
        >
          <span>레벨</span>
          <span>종류</span>
          <span>패턴</span>
          <span>메시지</span>
          <span>대체어</span>
          <span>상태</span>
          <span>액션</span>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-[14px]" style={{ color: 'var(--text-muted)' }}>
            조건에 맞는 규칙이 없습니다
          </div>
        )}
        {filtered.map((rule, i) => (
          <div
            key={rule.id}
            className="grid items-center px-4 py-3 text-[13px] transition-colors"
            style={{
              gridTemplateColumns: '90px 60px 1fr 1fr 1fr 80px 80px',
              borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
              opacity: rule.active ? 1 : 0.45,
            }}
            onMouseOver={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
            onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
          >
            <span
              className="inline-flex w-fit px-2 py-0.5 rounded-full text-[11px] font-semibold"
              style={{ background: LEVEL_STYLE[rule.level].bg, color: LEVEL_STYLE[rule.level].color }}
            >
              {LEVEL_STYLE[rule.level].label}
            </span>
            <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
              {rule.kind === 'word' ? '단어' : '정규식'}
            </span>
            <span
              className="font-mono text-[12px] truncate"
              style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
            >
              {rule.pattern}
            </span>
            <span className="truncate" style={{ color: 'var(--text-secondary)' }}>{rule.message}</span>
            <span
              className="truncate font-mono text-[12px]"
              style={{ color: 'var(--brand-accent)', fontFamily: 'var(--font-mono)' }}
            >
              {rule.replace || '—'}
            </span>
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                className="relative w-9 h-5 rounded-full transition-colors cursor-pointer"
                style={{ background: rule.active ? 'var(--brand-accent)' : 'var(--bg-tertiary)', border: '1px solid var(--border-strong)' }}
                onClick={() => toggleActive(rule.id)}
              >
                <div
                  className="absolute top-0.5 rounded-full transition-all"
                  style={{
                    width: 16, height: 16,
                    background: rule.active ? '#003320' : 'var(--text-muted)',
                    left: rule.active ? 'calc(100% - 18px)' : 2,
                  }}
                />
              </div>
            </label>
            <div className="flex gap-1">
              <button
                className="px-2 py-1 rounded-md text-[11px] transition-colors"
                style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none' }}
                onMouseOver={e => (e.currentTarget.style.color = 'var(--status-red)')}
                onMouseOut={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                onClick={() => deleteRule(rule.id)}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 규칙 추가 모달 */}
      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowAdd(false)}
        >
          <div
            className="flex flex-col gap-4 p-7 rounded-2xl border"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', width: 480 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="text-[20px] font-bold">규칙 추가</div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>레벨</div>
                <div className="flex gap-2">
                  {(['red', 'yellow', 'green'] as GuardKind[]).map(lv => (
                    <button
                      key={lv}
                      className="flex-1 py-2 rounded-lg text-[12px] font-semibold transition-colors"
                      style={{
                        background: draft.level === lv ? LEVEL_STYLE[lv].bg : 'var(--bg-tertiary)',
                        color: draft.level === lv ? LEVEL_STYLE[lv].color : 'var(--text-secondary)',
                        border: `1px solid ${draft.level === lv ? LEVEL_STYLE[lv].color : 'var(--border)'}`,
                      }}
                      onClick={() => setDraft(d => ({ ...d, level: lv }))}
                    >
                      {lv === 'red' ? '🔴' : lv === 'yellow' ? '🟡' : '🟢'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>종류</div>
                <div className="flex gap-2">
                  {(['word', 'regex'] as RuleKind[]).map(k => (
                    <button
                      key={k}
                      className="flex-1 py-2 rounded-lg text-[12px] font-semibold transition-colors"
                      style={{
                        background: draft.kind === k ? 'var(--bg-tertiary)' : 'transparent',
                        color: draft.kind === k ? 'var(--text-primary)' : 'var(--text-secondary)',
                        border: draft.kind === k ? '1px solid var(--border-strong)' : '1px solid var(--border)',
                      }}
                      onClick={() => setDraft(d => ({ ...d, kind: k }))}
                    >
                      {k === 'word' ? '단어' : '정규식'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {(['pattern', 'message', 'replace'] as const).map(field => (
              <div key={field}>
                <div className="text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  {field === 'pattern' ? '패턴 *' : field === 'message' ? '경고 메시지' : '대체어'}
                </div>
                <input
                  className="w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none font-mono"
                  style={{
                    background: 'var(--bg-tertiary)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)',
                    fontFamily: field === 'pattern' ? 'var(--font-mono)' : undefined,
                  }}
                  placeholder={field === 'pattern' ? '예: 무조건' : field === 'message' ? '예: 단정적 표현 금지' : '예: 일반적으로'}
                  value={draft[field]}
                  onChange={e => setDraft(d => ({ ...d, [field]: e.target.value }))}
                  onFocus={e => (e.target.style.borderColor = 'var(--brand-accent)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>
            ))}

            <div className="flex gap-2 justify-end mt-1">
              <button
                className="px-4 py-2 rounded-lg text-[14px] font-medium"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                onClick={() => setShowAdd(false)}
              >
                취소
              </button>
              <button
                className="px-4 py-2 rounded-lg text-[14px] font-semibold"
                style={{ background: 'var(--brand-accent)', color: '#003320', border: 'none' }}
                onClick={handleAdd}
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
