import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from('profiles')
        .select('display_name, email, avatar_url')
        .eq('id', user.id)
        .maybeSingle()
    : { data: null };

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: 720 }}>
      <div>
        <h1 className="text-[32px] font-bold m-0 mb-1 tracking-tight">⚙️ 설정</h1>
        <p className="text-[12px] m-0" style={{ color: 'var(--text-secondary)' }}>
          계정 정보 및 환경설정
        </p>
      </div>

      <div
        className="p-6 rounded-xl border flex flex-col gap-4"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
      >
        <div className="text-[16px] font-semibold">👤 계정</div>
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-[20px] font-bold flex-shrink-0 overflow-hidden"
            style={{ background: 'var(--brand-accent)', color: '#003320' }}
          >
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="" width={56} height={56} style={{ objectFit: 'cover' }} />
            ) : (
              (profile?.display_name ?? user?.email ?? 'U').slice(0, 1).toUpperCase()
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="text-[14px] font-semibold">
              {profile?.display_name ?? '이름 없음'}
            </div>
            <div className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
              {profile?.email ?? user?.email ?? '—'}
            </div>
          </div>
        </div>
      </div>

      <div
        className="p-6 rounded-xl border flex flex-col gap-3"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
      >
        <div className="text-[16px] font-semibold">🔧 빠른 이동</div>
        <div className="flex flex-col gap-1.5">
          <Link
            href="/admin/prompts"
            className="text-[13px] no-underline px-3 py-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)', background: 'var(--bg-tertiary)' }}
          >
            🛠️ 프롬프트 관리
          </Link>
          <Link
            href="/admin/guardrails"
            className="text-[13px] no-underline px-3 py-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)', background: 'var(--bg-tertiary)' }}
          >
            ⚖️ 가드레일 관리
          </Link>
          <Link
            href="/library"
            className="text-[13px] no-underline px-3 py-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)', background: 'var(--bg-tertiary)' }}
          >
            🖼️ 라이브러리
          </Link>
        </div>
      </div>

      <div
        className="p-6 rounded-xl border"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
      >
        <div className="text-[16px] font-semibold mb-2">📦 빌드 정보</div>
        <div className="text-[12px] flex flex-col gap-0.5" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          <div>Project: insu_insta studio</div>
          <div>Stack: Next.js 16 / Supabase / Gemini</div>
          <div>Phase: Engagement-polish + slide-templates + multi-msg</div>
        </div>
      </div>

      <p className="text-[12px] m-0" style={{ color: 'var(--text-muted)' }}>
        추가 환경설정(테마, 알림 등)은 추후 단계에서 추가됩니다.
      </p>
    </div>
  );
}
