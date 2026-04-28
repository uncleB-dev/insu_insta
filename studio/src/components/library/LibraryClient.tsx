'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import {
  deleteLibraryPhotoAction,
  registerLibraryPhotoAction,
} from '@/app/(chrome)/library/actions';

export type LibraryPhotoRow = {
  id: string;
  src: string;
  source: 'upload' | 'unsplash' | 'library';
  uses: number;
  created_at: string;
};

const TEMPLATE_LAYOUTS = [
  { id: 'bold', label: '볼드 텍스트', emoji: '🅱️', desc: '큰 텍스트 중심' },
  { id: 'split', label: '좌우 분할', emoji: '◧', desc: '이미지 + 텍스트' },
  { id: 'minimal', label: '미니멀', emoji: '◻', desc: '여백 중심' },
  { id: 'data', label: '데이터 카드', emoji: '📊', desc: '숫자·통계 강조' },
  { id: 'quote', label: '인용구', emoji: '❝', desc: '짧은 메시지' },
  { id: 'list', label: '리스트형', emoji: '☰', desc: '3·5항목 정리' },
];

const SOURCE_LABEL: Record<LibraryPhotoRow['source'], string> = {
  upload: '업로드',
  unsplash: 'Unsplash',
  library: '라이브러리',
};

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

type Tab = 'photos' | 'templates';
type SourceFilter = 'all' | LibraryPhotoRow['source'];

type PendingUpload = {
  id: string; // local-only client id
  name: string;
  status: 'uploading' | 'done' | 'error';
  message?: string;
};

export function LibraryClient({ initialPhotos }: { initialPhotos: LibraryPhotoRow[] }) {
  const router = useRouter();
  const [photos, setPhotos] = useState(initialPhotos);
  const [tab, setTab] = useState<Tab>('photos');
  const [filter, setFilter] = useState<SourceFilter>('all');
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filtered = photos.filter((p) => {
    if (filter !== 'all' && p.source !== filter) return false;
    return true;
  });

  // ─── Upload (client-side direct upload to Supabase Storage) ───────────
  const handleFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error('로그인이 필요합니다');
      return;
    }

    for (const file of list) {
      const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      // Validate
      if (!ALLOWED_TYPES.includes(file.type)) {
        setPending((prev) => [
          { id: localId, name: file.name, status: 'error', message: 'png/jpg/webp만 가능' },
          ...prev,
        ]);
        continue;
      }
      if (file.size > MAX_SIZE) {
        setPending((prev) => [
          { id: localId, name: file.name, status: 'error', message: '10MB 초과' },
          ...prev,
        ]);
        continue;
      }

      setPending((prev) => [
        { id: localId, name: file.name, status: 'uploading' },
        ...prev,
      ]);

      const ext =
        file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/webp' ? 'webp' : 'png';
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from('library')
        .upload(path, file, { contentType: file.type, upsert: false });

      if (uploadErr) {
        setPending((prev) =>
          prev.map((p) =>
            p.id === localId ? { ...p, status: 'error', message: uploadErr.message } : p,
          ),
        );
        continue;
      }

      // Register in library_photos via server action
      const res = await registerLibraryPhotoAction({ storagePath: path, source: 'upload' });
      if (res.error || !res.photo) {
        setPending((prev) =>
          prev.map((p) =>
            p.id === localId ? { ...p, status: 'error', message: res.error } : p,
          ),
        );
        continue;
      }

      // Optimistic insert into list
      const newPhoto = res.photo;
      setPhotos((prev) => [
        {
          id: newPhoto.id,
          src: newPhoto.src,
          source: 'upload',
          uses: 0,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      setPending((prev) =>
        prev.map((p) => (p.id === localId ? { ...p, status: 'done' } : p)),
      );
      // Auto-clear successes after 2s
      window.setTimeout(() => {
        setPending((prev) => prev.filter((p) => p.id !== localId));
      }, 2000);
    }

    router.refresh();
  };

  const onPickFiles = () => fileInputRef.current?.click();

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
    e.target.value = ''; // allow re-uploading same file
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  };

  // ─── Delete ───────────────────────────────────────────────────────────
  const handleDelete = (id: string) => {
    if (!window.confirm('이 사진을 삭제할까요?')) return;
    startTransition(async () => {
      const res = await deleteLibraryPhotoAction(id);
      if (res.error) {
        toast.error(`삭제 실패: ${res.error}`);
        return;
      }
      setPhotos((prev) => prev.filter((p) => p.id !== id));
      toast('사진 삭제됨');
    });
  };

  return (
    <div className="flex flex-col gap-6">
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
          onClick={onPickFiles}
        >
          ＋ 업로드
        </button>
      </div>

      <div
        className="flex gap-1 p-1 rounded-xl w-fit"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
      >
        {(['photos', 'templates'] as Tab[]).map((t) => (
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
            <div className="flex gap-2 flex-wrap">
              {(['all', 'upload', 'unsplash', 'library'] as SourceFilter[]).map((s) => (
                <button
                  key={s}
                  className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors"
                  style={{
                    background: filter === s ? 'var(--brand-accent-bg)' : 'var(--bg-tertiary)',
                    color: filter === s ? 'var(--brand-accent)' : 'var(--text-secondary)',
                    border: `1px solid ${filter === s ? 'var(--brand-accent)' : 'var(--border)'}`,
                  }}
                  onClick={() => setFilter(s)}
                >
                  {s === 'all' ? '전체' : SOURCE_LABEL[s]}
                </button>
              ))}
              <span className="ml-auto text-[12px] self-center" style={{ color: 'var(--text-muted)' }}>
                {filtered.length}장
              </span>
            </div>
          </div>

          {/* 진행 중인 업로드 표시 */}
          {pending.length > 0 && (
            <div
              className="flex flex-col gap-1.5 p-3 rounded-lg border text-[12px]"
              style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
            >
              {pending.map((p) => (
                <div key={p.id} className="flex items-center gap-2">
                  <span style={{ color: 'var(--text-secondary)' }}>{p.name}</span>
                  <span
                    style={{
                      color:
                        p.status === 'done'
                          ? 'var(--brand-accent)'
                          : p.status === 'error'
                            ? 'var(--status-red)'
                            : 'var(--status-yellow)',
                    }}
                  >
                    {p.status === 'done'
                      ? '✓ 완료'
                      : p.status === 'error'
                        ? `✗ 실패 (${p.message})`
                        : '⏳ 업로드 중…'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* 그리드 */}
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
            {/* 업로드 드롭존 */}
            <div
              className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all"
              style={{
                aspectRatio: '1/1',
                borderColor: dragOver ? 'var(--brand-accent)' : 'var(--border-strong)',
                background: dragOver ? 'var(--brand-accent-bg)' : 'transparent',
              }}
              onClick={onPickFiles}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
            >
              <span className="text-[24px] mb-1">＋</span>
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                업로드
              </span>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                또는 끌어놓기
              </span>
            </div>

            {filtered.map((photo) => (
              <div
                key={photo.id}
                className="relative rounded-xl overflow-hidden transition-all"
                style={{
                  aspectRatio: '1/1',
                  backgroundImage: `url(${photo.src})`,
                  backgroundSize: 'cover',
                  border: '1px solid var(--border)',
                }}
                onMouseEnter={() => setHoverId(photo.id)}
                onMouseLeave={() => setHoverId(null)}
              >
                {/* hover 메뉴 */}
                {hoverId === photo.id && (
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center gap-2"
                    style={{ background: 'rgba(0,0,0,0.55)' }}
                  >
                    <button
                      className="px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors"
                      style={{
                        background: 'var(--status-red)',
                        color: '#fff',
                        border: 'none',
                      }}
                      onClick={() => handleDelete(photo.id)}
                    >
                      🗑️ 삭제
                    </button>
                  </div>
                )}

                {/* 메타데이터 */}
                <div
                  className="absolute bottom-0 left-0 right-0 p-2 flex flex-wrap gap-1"
                  style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}
                >
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
                  >
                    {SOURCE_LABEL[photo.source]}
                  </span>
                  {photo.uses > 0 && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
                    >
                      {photo.uses}회 사용
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 숨겨진 파일 입력 */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp"
            style={{ display: 'none' }}
            onChange={onFileInputChange}
          />
        </>
      )}

      {tab === 'templates' && (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {TEMPLATE_LAYOUTS.map((tpl) => (
            <div
              key={tpl.id}
              className="rounded-xl border p-6 flex flex-col gap-3 cursor-pointer transition-all"
              style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
              onClick={() => toast(`'${tpl.label}' 템플릿 — 다음 phase에서 연결됩니다`)}
            >
              <div className="text-[40px]">{tpl.emoji}</div>
              <div>
                <div className="text-[16px] font-semibold mb-0.5">{tpl.label}</div>
                <div className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                  {tpl.desc}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {['후킹', '문제점', '해결책'].map((p) => (
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
