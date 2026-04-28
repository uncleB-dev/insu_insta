'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import {
  deleteLibraryPhotoAction,
  registerLibraryPhotoAction,
  toggleTemplateAction,
} from '@/app/(chrome)/library/actions';
import { generateBackgroundAction } from '@/app/(chrome)/posts/[id]/design/actions';
import { SlideCanvas, type CanvasSlide } from '@/components/post/SlideCanvas';
import type { Principle } from '@/lib/supabase/types';

export type LibraryPhotoRow = {
  id: string;
  src: string;
  source: 'upload' | 'unsplash' | 'library';
  uses: number;
  created_at: string;
};

export type LibraryTemplateRow = {
  slug: string;
  name: string;
  description: string | null;
  default_for_principle: Principle | null;
  active: boolean;
  sort_order: number;
};

// Sample slide data for template previews
const PRINCIPLE_LABEL: Record<Principle, string> = {
  hook: '후킹',
  problem: '문제점',
  solution: '해결책',
  doubt: '의심제거',
  scarcity: '희소성',
  cta: 'CTA',
};

function sampleSlideForTemplate(slug: string): CanvasSlide {
  const base: CanvasSlide = {
    principle: 'hook',
    main: '여기에 메시지가 들어가요',
    sub: '보조 설명 텍스트',
    layout: slug,
    blur: 6,
    overlay: 50,
    text_pos: 'mid',
    accent_color: 'green',
    bg_src: `https://picsum.photos/seed/tpl_${slug}/600/600`,
    ord: 1,
    emphasis: [],
  };
  // Per-template tweaks for natural preview
  switch (slug) {
    case 'data_card':
      return { ...base, main: '연 1억 넘을 수도', emphasis: ['1억'] };
    case 'checklist':
      return {
        ...base,
        main: '비급여통합\n진단비\n실손',
        emphasis: ['비급여통합', '진단비', '실손'],
      };
    case 'compare_box':
      return {
        ...base,
        main: '저렴한 보험\n실손만 의지',
        emphasis: ['저렴한 보험', '실손만 의지'],
      };
    case 'quote_card':
      return { ...base, main: '건강할 때 준비해야 의미가 있어요' };
    case 'cta_card':
      return { ...base, main: '댓글에 \'체크\' 남겨주세요', sub: '자료 보내드려요' };
    case 'qa_box':
      return { ...base, main: '실손 하나만 있으면 되는 거 아니에요?' };
    case 'msg_left':
      return { ...base, main: '삼촌 이거 진짜야?' };
    case 'msg_right':
      return { ...base, main: '진짜야. 정리해줄게.' };
    case 'bold_title':
    default:
      return { ...base, main: '하루 입원비 20만원' };
  }
}

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

type AiPhase = 'idle' | 'generated';

export function LibraryClient({
  initialPhotos,
  initialTemplates,
}: {
  initialPhotos: LibraryPhotoRow[];
  initialTemplates: LibraryTemplateRow[];
}) {
  const router = useRouter();
  const [photos, setPhotos] = useState(initialPhotos);
  const [templates, setTemplates] = useState(initialTemplates);
  const [tab, setTab] = useState<Tab>('photos');
  const [filter, setFilter] = useState<SourceFilter>('all');
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // AI generation modal (library-ai-generation)
  const [showAi, setShowAi] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiPhase, setAiPhase] = useState<AiPhase>('idle');
  const [lastGenerated, setLastGenerated] = useState<{ id: string; src: string } | null>(null);
  const [batchProgress, setBatchProgress] = useState<{ done: number; total: number } | null>(null);

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

  // ─── AI generation (library-ai-generation) ───────────────────────────
  // Plan SC-2: 1 image per click via existing generateBackgroundAction with bindToSlide:false
  const generateOne = async (prompt: string): Promise<{ id: string; src: string } | null> => {
    const res = await generateBackgroundAction({
      prompt,
      bindToSlide: false,
    });
    if (res.error || !res.photo) {
      toast.error(res.error ?? 'AI 생성 실패');
      return null;
    }
    const newPhoto = { id: res.photo.id, src: res.photo.src };
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
    return newPhoto;
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error('프롬프트를 입력해주세요');
      return;
    }
    setAiBusy(true);
    const photo = await generateOne(aiPrompt.trim());
    setAiBusy(false);
    if (photo) {
      setLastGenerated(photo);
      setAiPhase('generated');
      toast('✓ AI 생성 완료');
    }
  };

  // Plan SC-3: 3 sequential variations of the same prompt
  const handleBatch3 = async () => {
    if (!aiPrompt.trim() || aiBusy) return;
    setAiBusy(true);
    setBatchProgress({ done: 0, total: 3 });
    const variations = [' (variation A)', ' (variation B)', ' (variation C)'];
    for (let i = 0; i < variations.length; i++) {
      const photo = await generateOne(aiPrompt.trim() + variations[i]);
      if (photo) setLastGenerated(photo);
      setBatchProgress({ done: i + 1, total: 3 });
    }
    setAiBusy(false);
    setBatchProgress(null);
    toast('✓ 3장 추가 생성 완료');
  };

  const resetAi = () => {
    setShowAi(false);
    setAiPrompt('');
    setAiPhase('idle');
    setLastGenerated(null);
    setBatchProgress(null);
  };

  const startAnotherPrompt = () => {
    setAiPrompt('');
    setAiPhase('idle');
    setLastGenerated(null);
    setBatchProgress(null);
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
        <div className="flex gap-2">
          <button
            className="px-4 py-2.5 rounded-lg font-semibold text-[14px] transition-colors"
            style={{
              background: 'var(--brand-accent-bg)',
              color: 'var(--brand-accent)',
              border: '1px solid var(--brand-accent)',
            }}
            onClick={() => {
              setAiPhase('idle');
              setAiPrompt('');
              setShowAi(true);
            }}
          >
            🎨 AI 생성
          </button>
          <button
            className="px-4 py-2.5 rounded-lg font-semibold text-[14px] transition-colors"
            style={{ background: 'var(--brand-accent)', color: '#003320', border: 'none' }}
            onClick={onPickFiles}
          >
            ＋ 업로드
          </button>
        </div>
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
        <>
          <p className="text-[12px] m-0" style={{ color: 'var(--text-secondary)' }}>
            슬라이드 시각 템플릿 — 비활성화하면 디자인 페이지의 레이아웃 선택에서 사라집니다.
          </p>
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {templates.map((tpl) => {
              const sample = sampleSlideForTemplate(tpl.slug);
              return (
                <div
                  key={tpl.slug}
                  className="rounded-xl border p-4 flex flex-col gap-3 transition-all"
                  style={{
                    background: 'var(--bg-secondary)',
                    borderColor: 'var(--border)',
                    opacity: tpl.active ? 1 : 0.5,
                  }}
                >
                  {/* 미니 미리보기 */}
                  <div
                    className="rounded-lg overflow-hidden"
                    style={{ width: '100%', aspectRatio: '1/1', position: 'relative' }}
                  >
                    <div
                      style={{
                        width: 200,
                        height: 200,
                        transform: 'scale(1)',
                        transformOrigin: 'top left',
                        position: 'absolute',
                        inset: 0,
                      }}
                    >
                      <SlideCanvas slide={sample} size={200} />
                    </div>
                  </div>

                  <div>
                    <div className="text-[16px] font-semibold mb-0.5">{tpl.name}</div>
                    {tpl.description && (
                      <div className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                        {tpl.description}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    {tpl.default_for_principle ? (
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                        style={{
                          background: 'var(--brand-accent-bg)',
                          color: 'var(--brand-accent)',
                          border: '1px solid var(--brand-accent)',
                        }}
                      >
                        ★ {PRINCIPLE_LABEL[tpl.default_for_principle]} 기본
                      </span>
                    ) : (
                      <span />
                    )}

                    {/* 활성/비활성 스위치 */}
                    <div
                      className="relative w-9 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0"
                      style={{
                        background: tpl.active ? 'var(--brand-accent)' : 'var(--bg-tertiary)',
                        border: '1px solid var(--border-strong)',
                      }}
                      onClick={() => {
                        const next = !tpl.active;
                        setTemplates((prev) =>
                          prev.map((t) => (t.slug === tpl.slug ? { ...t, active: next } : t)),
                        );
                        startTransition(async () => {
                          const res = await toggleTemplateAction(tpl.slug, next);
                          if (res.error) {
                            toast.error(`상태 변경 실패: ${res.error}`);
                            setTemplates((prev) =>
                              prev.map((t) =>
                                t.slug === tpl.slug ? { ...t, active: !next } : t,
                              ),
                            );
                          } else {
                            toast(`✓ ${tpl.name} ${next ? '활성' : '비활성'}`);
                          }
                        });
                      }}
                    >
                      <div
                        className="absolute top-0.5 rounded-full transition-all"
                        style={{
                          width: 16,
                          height: 16,
                          background: tpl.active ? '#003320' : 'var(--text-muted)',
                          left: tpl.active ? 'calc(100% - 18px)' : 2,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* AI generation modal — library-ai-generation */}
      {showAi && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => !aiBusy && resetAi()}
        >
          <div
            className="p-7 rounded-2xl border flex flex-col gap-4"
            style={{
              background: 'var(--bg-secondary)',
              borderColor: 'var(--border)',
              width: 540,
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <span className="text-[24px]">🎨</span>
              <h2 className="text-[20px] font-bold m-0">
                AI 배경 생성 {aiPhase === 'generated' ? '— 결과' : ''}
              </h2>
            </div>

            {aiPhase === 'idle' && (
              <>
                <p className="text-[12px] m-0" style={{ color: 'var(--text-secondary)' }}>
                  슬라이드와 무관한 스톡 사진을 라이브러리에 추가합니다. 디자인 단계에서 어떤
                  게시물에든 골라 쓸 수 있어요.
                </p>
                <textarea
                  className="w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none resize-none font-mono"
                  style={{
                    background: 'var(--bg-tertiary)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)',
                    minHeight: 160,
                    fontFamily: 'var(--font-mono)',
                  }}
                  placeholder="예: 한국 아파트 단지, 늦가을 노을, 따뜻한 톤, 인스타 카드뉴스 배경, 1:1, 텍스트 영역 비워둔 깔끔한 구성"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  disabled={aiBusy}
                />
                <div className="flex gap-2 justify-end">
                  <button
                    className="px-4 py-2 rounded-lg text-[14px] font-medium disabled:opacity-50"
                    style={{
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border)',
                    }}
                    disabled={aiBusy}
                    onClick={resetAi}
                  >
                    취소
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg text-[14px] font-semibold disabled:opacity-50"
                    style={{ background: 'var(--brand-accent)', color: '#003320', border: 'none' }}
                    disabled={aiBusy || !aiPrompt.trim()}
                    onClick={handleAiGenerate}
                  >
                    {aiBusy ? '🎨 생성 중… (10~20초)' : '✨ 생성'}
                  </button>
                </div>
              </>
            )}

            {aiPhase === 'generated' && (
              <>
                {/* 마지막 생성 결과 미리보기 */}
                {lastGenerated && (
                  <div
                    className="rounded-lg overflow-hidden"
                    style={{
                      width: '100%',
                      aspectRatio: '1/1',
                      backgroundImage: `url(${lastGenerated.src})`,
                      backgroundSize: 'cover',
                      border: '1px solid var(--border)',
                    }}
                  />
                )}
                <p className="text-[12px] m-0" style={{ color: 'var(--text-secondary)' }}>
                  생성된 사진은 이미 라이브러리에 추가되었습니다. 같은 스타일로 더 만들거나, 다른 프롬프트로 시작할 수 있어요.
                </p>

                {/* 진행률 */}
                {batchProgress && (
                  <div
                    className="px-3 py-2 rounded-lg text-[13px]"
                    style={{
                      background: 'var(--bg-tertiary)',
                      color: 'var(--brand-accent)',
                      border: '1px solid var(--brand-accent)',
                    }}
                  >
                    🎨 일괄 생성 진행 중… ({batchProgress.done}/{batchProgress.total})
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <button
                    className="w-full py-2.5 rounded-lg text-[13px] font-semibold disabled:opacity-50"
                    style={{
                      background: 'var(--brand-accent-bg)',
                      color: 'var(--brand-accent)',
                      border: '1px solid var(--brand-accent)',
                    }}
                    disabled={aiBusy}
                    onClick={handleBatch3}
                  >
                    🎨 유사 프롬프트로 3장 더 (~$0.117)
                  </button>
                  <button
                    className="w-full py-2.5 rounded-lg text-[13px] font-medium disabled:opacity-50"
                    style={{
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border)',
                    }}
                    disabled={aiBusy}
                    onClick={startAnotherPrompt}
                  >
                    ✨ 다른 프롬프트로 1장 더
                  </button>
                  <button
                    className="w-full py-2.5 rounded-lg text-[13px] font-medium disabled:opacity-50"
                    style={{
                      background: 'transparent',
                      color: 'var(--text-secondary)',
                      border: '1px solid transparent',
                    }}
                    disabled={aiBusy}
                    onClick={resetAi}
                  >
                    닫기
                  </button>
                </div>
              </>
            )}

            <p className="text-[11px] m-0 text-center" style={{ color: 'var(--text-muted)' }}>
              1장당 약 $0.039 (Gemini Nano Banana)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
