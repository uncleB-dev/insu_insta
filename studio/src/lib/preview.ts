// Shared loader for the preview body — used by both /posts/[id]/preview and /posts/[id]

import { createClient } from './supabase/server';
import type {
  PreviewHashtags,
  PreviewSlide,
} from '@/components/post/PreviewBody';
import type { HashtagCategory, PostStatus, Principle, Speaker } from './supabase/types';

export type PreviewBundle = {
  postId: string;
  title: string;
  status: PostStatus;
  caption: string;
  scheduleAt: string | null;
  ctaKind: string | null;
  rewardLink: string | null;
  headerText: string | null;
  headerImageUrl: string | null;
  slides: PreviewSlide[];
  hashtags: PreviewHashtags;
};

const EMPTY_TAGS: PreviewHashtags = {
  brand: [],
  topic: [],
  target: [],
  general: [],
};

export async function loadPreviewBundle(postId: string): Promise<PreviewBundle | null> {
  const supabase = await createClient();

  const [{ data: post }, { data: slidesRows }, { data: tagsRows }] = await Promise.all([
    supabase
      .from('posts')
      .select(
        'id, title, status, caption, schedule_at, cta_kind, reward_link, header_text, header_image_url',
      )
      .eq('id', postId)
      .maybeSingle(),
    supabase
      .from('slides')
      .select(
        `id, ord, principle, speaker, main_text, sub_text, emphasis,
         layout, blur, overlay, text_pos, accent_color, bg_photo_id,
         main_font_size, sub_font_size, line_height,
         main_text2, main_text3, main_text4, speaker2, speaker3, speaker4,
         bg_photo:library_photos!slides_bg_photo_fk(id, src)`,
      )
      .eq('post_id', postId)
      .order('ord', { ascending: true }),
    supabase
      .from('hashtags')
      .select('category, tag')
      .eq('post_id', postId),
  ]);

  if (!post) return null;

  type SlideRow = {
    id: string;
    ord: number;
    principle: Principle;
    speaker: Speaker;
    main_text: string;
    sub_text: string | null;
    emphasis: string[] | null;
    layout: string | null;
    blur: number | null;
    overlay: number | null;
    text_pos: string | null;
    accent_color: string | null;
    main_font_size: number | null;
    sub_font_size: number | null;
    line_height: number | null;
    main_text2: string | null;
    main_text3: string | null;
    main_text4: string | null;
    speaker2: Speaker | null;
    speaker3: Speaker | null;
    speaker4: Speaker | null;
    bg_photo: { id: string; src: string } | null;
  };

  const slides: PreviewSlide[] = ((slidesRows ?? []) as unknown as SlideRow[]).map((r) => ({
    id: r.id,
    ord: r.ord,
    principle: r.principle,
    speaker: r.speaker,
    main: r.main_text,
    sub: r.sub_text ?? '',
    emphasis: r.emphasis ?? [],
    layout: r.layout ?? 'msg_left',
    blur: r.blur ?? 0,
    overlay: r.overlay ?? 50,
    text_pos: r.text_pos ?? 'mid',
    accent_color: r.accent_color ?? 'green',
    bg_src: r.bg_photo?.src ?? '',
    main_font_size: r.main_font_size,
    sub_font_size: r.sub_font_size,
    line_height: r.line_height,
    main2: r.main_text2,
    main3: r.main_text3,
    main4: r.main_text4,
    speaker2: r.speaker2,
    speaker3: r.speaker3,
    speaker4: r.speaker4,
    header_text: post.header_text ?? null,
    header_image_url: post.header_image_url ?? null,
  }));

  const hashtags: PreviewHashtags = { ...EMPTY_TAGS };
  for (const row of tagsRows ?? []) {
    const cat = row.category as HashtagCategory;
    hashtags[cat] = [...hashtags[cat], row.tag];
  }

  return {
    postId: post.id,
    title: post.title,
    status: post.status as PostStatus,
    caption: post.caption ?? '',
    scheduleAt: post.schedule_at,
    ctaKind: post.cta_kind ?? null,
    rewardLink: post.reward_link ?? null,
    headerText: post.header_text ?? null,
    headerImageUrl: post.header_image_url ?? null,
    slides,
    hashtags,
  };
}
