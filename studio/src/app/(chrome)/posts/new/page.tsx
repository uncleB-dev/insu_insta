'use client';

import { Suspense, useEffect, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { SERIES, PERSONAS } from '@/lib/mock';
import type { Series, PersonaKey } from '@/lib/mock';
import { createBlankPostAction } from './actions';

const inputCls =
  'w-full px-3 py-2.5 rounded-lg border text-[14px] outline-none transition-colors resize-none';
const inputStyle = {
  background: 'var(--bg-tertiary)',
  borderColor: 'var(--border)',
  color: 'var(--text-primary)',
};

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label
      className="block text-[13px] font-semibold mb-2"
      style={{ color: 'var(--text-primary)' }}
    >
      {children}
      {required && (
        <span className="ml-1" style={{ color: 'var(--brand-accent)' }}>
          *
        </span>
      )}
    </label>
  );
}

function NewPostInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [topic, setTopic] = useState('');
  const [series, setSeries] = useState<Series>('A');
  const [persona, setPersona] = useState<PersonaKey>('30s_office');
  const [slideCount, setSlideCount] = useState(9);
  const [cta, setCta] = useState('save');
  const [rewardLink, setRewardLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  // Pre-fill topic from URL ?topic=
  useEffect(() => {
    const t = searchParams.get('topic');
    if (t) setTopic(t);
  }, [searchParams]);

  const canCreate = topic.trim().length > 0;

  const handleCreate = () => {
    if (!canCreate || loading) return;
    setLoading(true);
    startTransition(async () => {
      const res = await createBlankPostAction({
        topic: topic.trim(),
        series,
        persona,
        slideCount,
        cta,
        rewardLink: cta === 'comment_link' ? rewardLink.trim() : null,
      });
      if (res.error || !res.postId) {
        setLoading(false);
        toast.error(res.error ?? '생성 실패');
        return;
      }
      router.push(`/posts/${res.postId}/script`);
    });
  };

  const selectCls =
    'w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none transition-colors';

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: 720, margin: '0 auto' }}>
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[24px]">1️⃣</span>
          <h1 className="text-[32px] font-bold m-0 tracking-tight">새 카드뉴스 시작</h1>
        </div>
        <p className="text-sm m-0" style={{ color: 'var(--text-secondary)' }}>
          주제와 카드 수만 정하시면 빈 슬라이드가 준비됩니다. 다음 단계에서 직접 작성하세요.
        </p>
      </div>

      <div
        className="p-8 rounded-xl border flex flex-col gap-5"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
      >
        <div>
          <FieldLabel required>주제 한 줄</FieldLabel>
          <textarea
            className={inputCls}
            style={{ ...inputStyle, minHeight: 60 }}
            rows={2}
            placeholder="예: 5세대 실손보험 전환해야 할까?"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = 'var(--brand-accent)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
          />
          <p className="text-[12px] mt-1.5 m-0" style={{ color: 'var(--text-muted)' }}>
            나중에 캡션·해시태그 AI 자동 생성 시 참고됩니다.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel required>카드 수</FieldLabel>
            <select
              className={selectCls}
              style={inputStyle}
              value={slideCount}
              onChange={(e) => setSlideCount(Number(e.target.value))}
            >
              <option value={5}>5컷 (짧게)</option>
              <option value={7}>7컷</option>
              <option value={9}>9컷 (표준)</option>
              <option value={11}>11컷</option>
              <option value={13}>13컷 (자세히)</option>
            </select>
          </div>
          <div>
            <FieldLabel required>시리즈</FieldLabel>
            <select
              className={selectCls}
              style={inputStyle}
              value={series}
              onChange={(e) => setSeries(e.target.value as Series)}
            >
              {(Object.entries(SERIES) as [Series, string][]).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>페르소나</FieldLabel>
            <select
              className={selectCls}
              style={inputStyle}
              value={persona}
              onChange={(e) => setPersona(e.target.value as PersonaKey)}
            >
              {(Object.entries(PERSONAS) as [PersonaKey, string][]).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel>CTA</FieldLabel>
            <select
              className={selectCls}
              style={inputStyle}
              value={cta}
              onChange={(e) => setCta(e.target.value)}
            >
              <option value="save">저장 유도</option>
              <option value="share">공유 유도</option>
              <option value="dm">DM 문의</option>
              <option value="link">링크 클릭</option>
              <option value="comment_link">💬 댓글 유도 + 링크 발송</option>
            </select>
          </div>
        </div>

        {cta === 'comment_link' && (
          <div>
            <FieldLabel>🔒 댓글 단 사람에게 보낼 링크 (비공개 메모)</FieldLabel>
            <textarea
              className={inputCls}
              style={{ ...inputStyle, minHeight: 60 }}
              rows={2}
              placeholder="예: https://notion.so/xxx (메모용 — 캡션·슬라이드에 노출 X)"
              value={rewardLink}
              onChange={(e) => setRewardLink(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-end">
        <button
          className="px-4 py-2.5 rounded-lg font-semibold text-[14px] transition-colors"
          style={{
            background: 'transparent',
            color: 'var(--text-secondary)',
            border: '1px solid transparent',
          }}
          onClick={() => router.push('/')}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'var(--bg-tertiary)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          ← 취소
        </button>
        <button
          className="px-4 py-2.5 rounded-lg font-semibold text-[14px] transition-colors disabled:opacity-40"
          style={{ background: 'var(--brand-accent)', color: '#003320' }}
          disabled={!canCreate || loading}
          onClick={handleCreate}
        >
          {loading ? '준비 중…' : '스크립트 작성 →'}
        </button>
      </div>
    </div>
  );
}

export default function NewPostPage() {
  return (
    <Suspense fallback={null}>
      <NewPostInner />
    </Suspense>
  );
}
