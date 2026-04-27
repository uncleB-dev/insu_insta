import type { GuardLevel, GuardRuleKind } from './supabase/types';

export type GuardHit = {
  word: string;
  kind: 'red' | 'yellow';
  suggest: string;
};

export type GuardrailRule = {
  id: string;
  level: GuardLevel;
  kind: GuardRuleKind;
  pattern: string;
  replace_with: string | null;
  active: boolean;
};

/** Evaluate text against active guardrail rules.
 * Returns only red/yellow hits (green rules are ignored — they're informational only). */
export function evaluateGuards(text: string, rules: GuardrailRule[]): GuardHit[] {
  if (!text) return [];
  const hits: GuardHit[] = [];

  for (const rule of rules) {
    if (!rule.active) continue;
    if (rule.level === 'green') continue;

    const suggest = rule.replace_with ?? '';

    if (rule.kind === 'word') {
      if (text.includes(rule.pattern)) {
        hits.push({ word: rule.pattern, kind: rule.level, suggest });
      }
    } else {
      try {
        const re = new RegExp(rule.pattern, 'g');
        const matches = text.match(re);
        if (matches) {
          for (const m of matches) {
            hits.push({ word: m, kind: rule.level, suggest });
          }
        }
      } catch {
        // skip invalid regex silently
      }
    }
  }
  return hits;
}
