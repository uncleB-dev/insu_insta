// Editor-facing types — used by SlideCard, GuardedText, ScriptEditorClient
// These mirror the DB row shape but use field names the UI components expect.

import type { GuardHit } from './guardrails';
import type { Principle, Speaker } from './supabase/types';

export type EditorSlide = {
  id: string;
  ord: number;
  principle: Principle;
  speaker: Speaker;
  scene: string;
  main: string;
  sub: string;
  emphasis: string[];
  guards: GuardHit[];
  // slide-header-multi-msg: additional bubbles (only used in dialogue layouts)
  main2?: string | null;
  main3?: string | null;
  main4?: string | null;
  speaker2?: Speaker | null;
  speaker3?: Speaker | null;
  speaker4?: Speaker | null;
  layout?: string | null;
};

export type EditorPost = {
  id: string;
  title: string;
  status: 'draft' | 'scheduled' | 'published';
};
