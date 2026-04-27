'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

export function SeedDemoButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSeed = async () => {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error('로그인이 필요합니다');
      setLoading(false);
      return;
    }

    const { error } = await supabase.rpc('seed_demo_posts', { p_owner: user.id });

    if (error) {
      toast.error(`데모 데이터 생성 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    toast('✓ 데모 게시물 8개가 생성되었어요');
    router.refresh();
    setLoading(false);
  };

  return (
    <button
      onClick={handleSeed}
      disabled={loading}
      className="px-4 py-2.5 rounded-lg font-semibold text-[13px] transition-colors disabled:opacity-50"
      style={{
        background: 'var(--bg-tertiary)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-strong)',
        cursor: loading ? 'wait' : 'pointer',
      }}
    >
      {loading ? '생성 중…' : '🌱 데모 데이터 채우기'}
    </button>
  );
}
