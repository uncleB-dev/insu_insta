'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { GuardLevel, GuardRuleKind } from '@/lib/supabase/types';

export type GuardrailRuleInput = {
  level: GuardLevel;
  kind: GuardRuleKind;
  pattern: string;
  message: string;
  replace_with: string | null;
};

export async function addGuardrailRule(input: GuardrailRuleInput) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('guardrail_rules')
    .insert({ ...input, active: true });
  if (error) return { error: error.message };
  revalidatePath('/admin/guardrails');
  return { error: null };
}

export async function toggleGuardrailRule(id: string, active: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('guardrail_rules')
    .update({ active })
    .eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin/guardrails');
  return { error: null };
}

export async function deleteGuardrailRule(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('guardrail_rules').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin/guardrails');
  return { error: null };
}
