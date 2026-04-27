import { GUARDRAIL_RULES } from './mock';

export type GuardHit = {
  word: string;
  kind: 'red' | 'yellow' | 'green';
  suggest: string;
};

export function checkGuardrails(text: string): GuardHit[] {
  const hits: GuardHit[] = [];
  for (const rule of GUARDRAIL_RULES) {
    if (!rule.active) continue;
    if (rule.level === 'green') continue;
    if (rule.kind === 'word') {
      if (text.includes(rule.pattern)) {
        hits.push({ word: rule.pattern, kind: rule.level as 'red' | 'yellow', suggest: rule.replace });
      }
    } else {
      try {
        const re = new RegExp(rule.pattern, 'g');
        const matches = text.match(re);
        if (matches) {
          matches.forEach(m => {
            hits.push({ word: m, kind: rule.level as 'red' | 'yellow', suggest: rule.replace });
          });
        }
      } catch {
        // skip invalid regex
      }
    }
  }
  return hits;
}
