import { createClient } from '@/lib/supabase/server';
import { GuardrailsClient, type GuardrailRuleRow } from '@/components/admin/GuardrailsClient';

export default async function GuardrailsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('guardrail_rules')
    .select('id, level, kind, pattern, message, replace_with, active')
    .order('level', { ascending: true })
    .order('created_at', { ascending: true });

  const rules: GuardrailRuleRow[] = data ?? [];

  return <GuardrailsClient rules={rules} />;
}
