import { createClient } from '@/lib/supabase/server';
import {
  LibraryClient,
  type LibraryPhotoRow,
  type LibraryTemplateRow,
} from '@/components/library/LibraryClient';

export default async function LibraryPage() {
  const supabase = await createClient();

  const [{ data: photos }, { data: templates }] = await Promise.all([
    supabase
      .from('library_photos')
      .select('id, src, source, uses, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('templates')
      .select('slug, name, description, default_for_principle, active, sort_order')
      .order('sort_order', { ascending: true }),
  ]);

  const photoRows: LibraryPhotoRow[] = (photos ?? []) as LibraryPhotoRow[];
  const templateRows: LibraryTemplateRow[] = (templates ?? []) as LibraryTemplateRow[];

  return <LibraryClient initialPhotos={photoRows} initialTemplates={templateRows} />;
}
