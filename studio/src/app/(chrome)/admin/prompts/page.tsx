import { createClient } from '@/lib/supabase/server';
import { PromptsClient, type PromptVersionRow } from '@/components/admin/PromptsClient';

export default async function PromptsPage() {
  const supabase = await createClient();

  const { data: prompt } = await supabase
    .from('prompts')
    .select('id, active_version_id')
    .eq('slug', 'script_generation')
    .maybeSingle();

  let versions: PromptVersionRow[] = [];
  if (prompt) {
    const { data } = await supabase
      .from('prompt_versions')
      .select('id, version, body, author, created_at')
      .eq('prompt_id', prompt.id)
      .order('created_at', { ascending: false });
    versions = data ?? [];
  }

  return <PromptsClient versions={versions} activeVersionId={prompt?.active_version_id ?? null} />;
}
