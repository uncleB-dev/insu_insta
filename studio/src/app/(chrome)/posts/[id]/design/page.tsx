import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  DesignEditorClient,
  type DesignSlide,
  type LibraryPhoto,
} from '@/components/post/DesignEditorClient';
import type { Principle, Speaker } from '@/lib/supabase/types';

type SlideRow = {
  id: string;
  ord: number;
  principle: Principle;
  speaker: Speaker;
  main_text: string;
  sub_text: string | null;
  layout: string | null;
  blur: number;
  overlay: number;
  text_pos: string | null;
  accent_color: string | null;
  bg_photo_id: string | null;
  bg_photo: { id: string; src: string } | null;
};

type LibraryPhotoRow = {
  id: string;
  src: string;
};

export default async function DesignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: post }, { data: slidesRows }, { data: photosRows }] =
    await Promise.all([
      supabase.from('posts').select('id, title').eq('id', id).maybeSingle(),
      supabase
        .from('slides')
        .select(
          `id, ord, principle, speaker, main_text, sub_text, layout, blur, overlay, text_pos, accent_color, bg_photo_id, bg_photo:library_photos!slides_bg_photo_fk(id, src)`,
        )
        .eq('post_id', id)
        .order('ord', { ascending: true }),
      supabase
        .from('library_photos')
        .select('id, src')
        .order('created_at', { ascending: false })
        .limit(60),
    ]);

  if (!post) notFound();

  const slides: DesignSlide[] = ((slidesRows ?? []) as unknown as SlideRow[]).map(
    (row) => ({
      id: row.id,
      ord: row.ord,
      principle: row.principle,
      speaker: row.speaker,
      main: row.main_text,
      sub: row.sub_text ?? '',
      layout: row.layout ?? 'A',
      blur: row.blur ?? 0,
      overlay: row.overlay ?? 50,
      text_pos: row.text_pos ?? 'mid',
      accent_color: row.accent_color ?? 'green',
      bg_photo_id: row.bg_photo_id,
      bg_src: row.bg_photo?.src ?? '',
    }),
  );

  const libraryPhotos: LibraryPhoto[] = ((photosRows ?? []) as LibraryPhotoRow[]).map(
    (p) => ({ id: p.id, src: p.src }),
  );

  return (
    <DesignEditorClient
      postId={id}
      initialSlides={slides}
      libraryPhotos={libraryPhotos}
    />
  );
}
