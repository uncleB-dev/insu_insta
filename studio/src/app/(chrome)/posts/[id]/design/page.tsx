import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  DesignEditorClient,
  type DesignSlide,
  type DesignTemplate,
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
  emphasis: string[] | null;
  layout: string | null;
  blur: number;
  overlay: number;
  text_pos: string | null;
  accent_color: string | null;
  bg_photo_id: string | null;
  main_font_size: number | null;
  sub_font_size: number | null;
  line_height: number | null;
  bg_photo: { id: string; src: string } | null;
};

type LibraryPhotoRow = {
  id: string;
  src: string;
};

type TemplateRow = {
  slug: string;
  name: string;
  description: string | null;
  default_for_principle: Principle | null;
};

export default async function DesignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: post }, { data: slidesRows }, { data: photosRows }, { data: templatesRows }] =
    await Promise.all([
      supabase.from('posts').select('id, title').eq('id', id).maybeSingle(),
      supabase
        .from('slides')
        .select(
          `id, ord, principle, speaker, main_text, sub_text, emphasis, layout, blur, overlay, text_pos, accent_color, bg_photo_id, main_font_size, sub_font_size, line_height, bg_photo:library_photos!slides_bg_photo_fk(id, src)`,
        )
        .eq('post_id', id)
        .order('ord', { ascending: true }),
      supabase
        .from('library_photos')
        .select('id, src')
        .order('created_at', { ascending: false })
        .limit(60),
      // slide-templates: load only active templates ordered by sort_order
      supabase
        .from('templates')
        .select('slug, name, description, default_for_principle')
        .eq('active', true)
        .order('sort_order', { ascending: true }),
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
      emphasis: row.emphasis ?? [],
      layout: row.layout ?? 'msg_left',
      blur: row.blur ?? 0,
      overlay: row.overlay ?? 50,
      text_pos: row.text_pos ?? 'mid',
      accent_color: row.accent_color ?? 'green',
      bg_photo_id: row.bg_photo_id,
      bg_src: row.bg_photo?.src ?? '',
      main_font_size: row.main_font_size,
      sub_font_size: row.sub_font_size,
      line_height: row.line_height,
    }),
  );

  const libraryPhotos: LibraryPhoto[] = ((photosRows ?? []) as LibraryPhotoRow[]).map(
    (p) => ({ id: p.id, src: p.src }),
  );

  const templates: DesignTemplate[] = ((templatesRows ?? []) as TemplateRow[]).map(
    (t) => ({
      slug: t.slug,
      name: t.name,
      description: t.description,
      default_for_principle: t.default_for_principle,
    }),
  );

  return (
    <DesignEditorClient
      postId={id}
      initialSlides={slides}
      libraryPhotos={libraryPhotos}
      templates={templates}
    />
  );
}
