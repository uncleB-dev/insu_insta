'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  addGuardrailRule,
  deleteGuardrailRule,
  toggleGuardrailRule,
  type GuardrailRuleInput,
} from '@/app/(chrome)/admin/guardrails/actions';
import type { GuardLevel, GuardRuleKind } from '@/lib/supabase/types';

export type GuardrailRuleRow = {
  id: string;
  level: GuardLevel;
  kind: GuardRuleKind;
  pattern: string;
  message: string;
  replace_with: string | null;
  active: boolean;
};

const LEVEL_STYLE: Record<GuardLevel, { bg: string; color: string; label: string }> = {
  red: { bg: 'rgba(255,77,109,0.15)', color: 'var(--status-red)', label: '🔴 금지' },
  yellow: { bg: 'rgba(255,180,0,0.15)', color: 'var(--status-yellow)', label: '🟡 경고' },
  green: { bg: 'rgba(0,255,136,0.1)', color: 'var(--brand-accent)', label: '🟢 안전' },
};

const EMPTY: GuardrailRuleInput = {
  level: 'yellow',
  kind: 'word',
  pattern: '',
  message: '',
  replace_with: '',
};

export function GuardrailsClient({ rules }: { rules: GuardrailRuleRow[] }) {
  const [filterLevel, setFilterLevel] = useState<'all' | GuardLevel>('all');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [q, setQ] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState<GuardrailRuleInput>(EMPTY);
  const [, startTransition] = useTransition();

  const filtered = rules.filter((r) => {
    if (filterLevel !== 'all' && r.level !== filterLevel) return false;
    if (filterActive === 'active' && !r.active) return false;
    if (filterActive === 'inactive' && r.active) return false;
    if (q && !r.pattern.includes(q) && !r.message.includes(q)) return false;
    return true;
  });

  const counts = {
    red: rules.filter((r) => r.level === 'red').length,
    yellow: rules.filter((r) => r.level === 'yellow').length,
    green: rules.filter((r) => r.level === 'green').length,
  };

  const onToggle = (id: string, active: boolean) => {
    startTransition(async () => {
      const res = await toggleGuardrailRule(id, active);
      if (res.error) toast.error(`상태 변경 실패: ${res.error}`);
      else toast('✓ 규칙 상태 변경됨');
    });
  };

  const onDelete = (id: string) => {
    if (!confirm('규칙을 삭제할까요?')) return;
    startTransition(async () => {
      const res = await deleteGuardrailRule(id);
      if (res.error) toast.error(`삭제 실패: ${res.error}`);
      else toast('규칙 삭제됨');
    });
  };

  const onAdd = () => {
    if (!draft.pattern.trim()) {
      toast.error('패턴을 입력해주세요');
      return;
    }
    startTransition(async () => {
      const res = await addGuardrailRule({
        ...draft,
        replace_with: draft.replace_with ? draft.replace_with : null,
      });
      if (res.error) {
        toast.error(`추가 실패: ${res.error}`);
        return;
      }
      setDraft(EMPTY);
      setShowAdd(false);
      toast('✓ 규칙 추가됨');
    });
  };

  return (
    <div className="flex flex-col gap-6">
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
          onClick={() => {
            setShowAdd(true);
            setDraft(EMPTY);
          }}
        >
          ＋ 규칙 추가
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {(['red', 'yellow', 'green'] as GuardLevel[]).map((level) => (
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
              활성 {rules.filter((r) => r.level === level && r.active).length}개
            </div>
          </div>
        ))}
      </div>

      <div
        className="flex flex-col gap-3 p-5 rounded-xl border"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
      >
        <input
          className="w-full px-3 py-2.5 rounded-lg border text-[14px] outline-none"
          style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          placeholder="🔍 패턴·메시지 검색..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="flex gap-2 flex-wrap">
          {(['all', 'red', 'yellow', 'green'] as const).map((lv) => (
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
          {(['all', 'active', 'inactive'] as const).map((af) => (
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
            className="grid items-center px-4 py-3 text-[13px]"
            style={{
              gridTemplateColumns: '90px 60px 1fr 1fr 1fr 80px 80px',
              borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
              opacity: rule.active ? 1 : 0.45,
            }}
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
            <span className="truncate" style={{ color: 'var(--text-secondary)' }}>
              {rule.message}
            </span>
            <span
              className="truncate font-mono text-[12px]"
              style={{ color: 'var(--brand-accent)', fontFamily: 'var(--font-mono)' }}
            >
              {rule.replace_with || '—'}
            </span>
            <div className="flex items-center">
              <div
                className="relative w-9 h-5 rounded-full transition-colors cursor-pointer"
                style={{
                  background: rule.active ? 'var(--brand-accent)' : 'var(--bg-tertiary)',
                  border: '1px solid var(--border-strong)',
                }}
                onClick={() => onToggle(rule.id, !rule.active)}
              >
                <div
                  className="absolute top-0.5 rounded-full transition-all"
                  style={{
                    width: 16,
                    height: 16,
                    background: rule.active ? '#003320' : 'var(--text-muted)',
                    left: rule.active ? 'calc(100% - 18px)' : 2,
                  }}
                />
              </div>
            </div>
            <div className="flex gap-1">
              <button
                className="px-2 py-1 rounded-md text-[11px] transition-colors"
                style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none' }}
                onClick={() => onDelete(rule.id)}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowAdd(false)}
        >
          <div
            className="flex flex-col gap-4 p-7 rounded-2xl border"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', width: 480 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[20px] font-bold">규칙 추가</div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  레벨
                </div>
                <div className="flex gap-2">
                  {(['red', 'yellow', 'green'] as GuardLevel[]).map((lv) => (
                    <button
                      key={lv}
                      className="flex-1 py-2 rounded-lg text-[12px] font-semibold transition-colors"
                      style={{
                        background: draft.level === lv ? LEVEL_STYLE[lv].bg : 'var(--bg-tertiary)',
                        color: draft.level === lv ? LEVEL_STYLE[lv].color : 'var(--text-secondary)',
                        border: `1px solid ${draft.level === lv ? LEVEL_STYLE[lv].color : 'var(--border)'}`,
                      }}
                      onClick={() => setDraft((d) => ({ ...d, level: lv }))}
                    >
                      {lv === 'red' ? '🔴' : lv === 'yellow' ? '🟡' : '🟢'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  종류
                </div>
                <div className="flex gap-2">
                  {(['word', 'regex'] as GuardRuleKind[]).map((k) => (
                    <button
                      key={k}
                      className="flex-1 py-2 rounded-lg text-[12px] font-semibold transition-colors"
                      style={{
                        background: draft.kind === k ? 'var(--bg-tertiary)' : 'transparent',
                        color: draft.kind === k ? 'var(--text-primary)' : 'var(--text-secondary)',
                        border: draft.kind === k ? '1px solid var(--border-strong)' : '1px solid var(--border)',
                      }}
                      onClick={() => setDraft((d) => ({ ...d, kind: k }))}
                    >
                      {k === 'word' ? '단어' : '정규식'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {(['pattern', 'message', 'replace_with'] as const).map((field) => (
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
                  placeholder={
                    field === 'pattern'
                      ? '예: 무조건'
                      : field === 'message'
                        ? '예: 단정적 표현 금지'
                        : '예: 일반적으로'
                  }
                  value={(draft[field] ?? '') as string}
                  onChange={(e) => setDraft((d) => ({ ...d, [field]: e.target.value }))}
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
                onClick={onAdd}
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
