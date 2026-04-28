import { createClient } from '@/lib/supabase/server';
import { LibraryClient, type LibraryPhotoRow } from '@/components/library/LibraryClient';

export default async function LibraryPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('library_photos')
    .select('id, src, source, uses, created_at')
    .order('created_at', { ascending: false });

  const photos: LibraryPhotoRow[] = (data ?? []) as LibraryPhotoRow[];

  return <LibraryClient initialPhotos={photos} />;
}
