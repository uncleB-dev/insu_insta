// Supabase DB types — hand-written to match supabase/migrations/0001_initial.sql

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Series = 'A' | 'B' | 'C';
export type Persona = '30s_office' | 'newbie' | 'parent' | 'newlywed';
export type PostStatus = 'draft' | 'scheduled' | 'published';
export type Principle = 'hook' | 'problem' | 'solution' | 'doubt' | 'scarcity' | 'cta';
export type Speaker = 'niece' | 'uncle' | 'none';
export type GuardLevel = 'red' | 'yellow' | 'green';
export type GuardRuleKind = 'word' | 'regex';
export type HashtagCategory = 'brand' | 'topic' | 'target' | 'general';
export type PhotoSource = 'upload' | 'unsplash' | 'library';

// ─── Row types ────────────────────────────────────────────────
export interface ProfileRow {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}
export interface ProfileInsert {
  id: string;
  email?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}
export type ProfileUpdate = Partial<ProfileInsert>;

export interface PostRow {
  id: string;
  owner_id: string;
  title: string;
  series: Series;
  persona: Persona;
  status: PostStatus;
  topic: string | null;
  facts: string | null;
  tone: string | null;
  cta_kind: string | null;
  caption: string | null;
  schedule_at: string | null;
  created_at: string;
  updated_at: string;
}
export interface PostInsert {
  id?: string;
  owner_id: string;
  title: string;
  series: Series;
  persona: Persona;
  status?: PostStatus;
  topic?: string | null;
  facts?: string | null;
  tone?: string | null;
  cta_kind?: string | null;
  caption?: string | null;
  schedule_at?: string | null;
  created_at?: string;
  updated_at?: string;
}
export type PostUpdate = Partial<PostInsert>;

export interface SlideRow {
  id: string;
  post_id: string;
  ord: number;
  principle: Principle;
  speaker: Speaker;
  scene: string | null;
  main_text: string;
  sub_text: string | null;
  emphasis: string[];
  layout: string | null;
  bg_photo_id: string | null;
  blur: number;
  overlay: number;
  text_pos: string | null;
  accent_color: string | null;
  main_font_size: number | null;
  sub_font_size: number | null;
  line_height: number | null;
  created_at: string;
  updated_at: string;
}
export interface SlideInsert {
  id?: string;
  post_id: string;
  ord: number;
  principle: Principle;
  speaker?: Speaker;
  scene?: string | null;
  main_text: string;
  sub_text?: string | null;
  emphasis?: string[];
  layout?: string | null;
  bg_photo_id?: string | null;
  blur?: number;
  overlay?: number;
  text_pos?: string | null;
  accent_color?: string | null;
  main_font_size?: number | null;
  sub_font_size?: number | null;
  line_height?: number | null;
  created_at?: string;
  updated_at?: string;
}
export type SlideUpdate = Partial<SlideInsert>;

export interface HashtagRow {
  id: string;
  post_id: string;
  category: HashtagCategory;
  tag: string;
  created_at: string;
}
export interface HashtagInsert {
  id?: string;
  post_id: string;
  category: HashtagCategory;
  tag: string;
  created_at?: string;
}
export type HashtagUpdate = Partial<HashtagInsert>;

export interface GuardrailRuleRow {
  id: string;
  level: GuardLevel;
  kind: GuardRuleKind;
  pattern: string;
  message: string;
  replace_with: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}
export interface GuardrailRuleInsert {
  id?: string;
  level: GuardLevel;
  kind: GuardRuleKind;
  pattern: string;
  message: string;
  replace_with?: string | null;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
}
export type GuardrailRuleUpdate = Partial<GuardrailRuleInsert>;

export interface PromptRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  active_version_id: string | null;
  created_at: string;
  updated_at: string;
}
export interface PromptInsert {
  id?: string;
  slug: string;
  title: string;
  description?: string | null;
  active_version_id?: string | null;
  created_at?: string;
  updated_at?: string;
}
export type PromptUpdate = Partial<PromptInsert>;

export interface PromptVersionRow {
  id: string;
  prompt_id: string;
  version: string;
  body: string;
  author: string | null;
  created_at: string;
}
export interface PromptVersionInsert {
  id?: string;
  prompt_id: string;
  version: string;
  body: string;
  author?: string | null;
  created_at?: string;
}
export type PromptVersionUpdate = Partial<PromptVersionInsert>;

export interface LibraryPhotoRow {
  id: string;
  src: string;
  source: PhotoSource;
  uses: number;
  uploaded_by: string | null;
  created_at: string;
}
export interface LibraryPhotoInsert {
  id?: string;
  src: string;
  source?: PhotoSource;
  uses?: number;
  uploaded_by?: string | null;
  created_at?: string;
}
export type LibraryPhotoUpdate = Partial<LibraryPhotoInsert>;

export interface GuardrailHitRow {
  id: string;
  slide_id: string;
  rule_id: string | null;
  level: GuardLevel;
  word: string;
  suggest: string | null;
  created_at: string;
}
export interface GuardrailHitInsert {
  id?: string;
  slide_id: string;
  rule_id?: string | null;
  level: GuardLevel;
  word: string;
  suggest?: string | null;
  created_at?: string;
}
export type GuardrailHitUpdate = Partial<GuardrailHitInsert>;

// ─── Database wrapper ────────────────────────────────────────
export interface Database {
  __InternalSupabase: {
    PostgrestVersion: '12';
  };
  public: {
    Tables: {
      profiles:         { Row: ProfileRow;         Insert: ProfileInsert;         Update: ProfileUpdate;         Relationships: [] };
      posts:            { Row: PostRow;            Insert: PostInsert;            Update: PostUpdate;            Relationships: [] };
      slides:           { Row: SlideRow;           Insert: SlideInsert;           Update: SlideUpdate;           Relationships: [] };
      hashtags:         { Row: HashtagRow;         Insert: HashtagInsert;         Update: HashtagUpdate;         Relationships: [] };
      guardrail_rules:  { Row: GuardrailRuleRow;   Insert: GuardrailRuleInsert;   Update: GuardrailRuleUpdate;   Relationships: [] };
      prompts:          { Row: PromptRow;          Insert: PromptInsert;          Update: PromptUpdate;          Relationships: [] };
      prompt_versions:  { Row: PromptVersionRow;   Insert: PromptVersionInsert;   Update: PromptVersionUpdate;   Relationships: [] };
      library_photos:   { Row: LibraryPhotoRow;    Insert: LibraryPhotoInsert;    Update: LibraryPhotoUpdate;    Relationships: [] };
      guardrail_hits:   { Row: GuardrailHitRow;    Insert: GuardrailHitInsert;    Update: GuardrailHitUpdate;    Relationships: [] };
    };
    Views: { [_ in never]: never };
    Functions: {
      seed_demo_posts: {
        Args: { p_owner: string };
        Returns: void;
      };
    };
    Enums: {
      series_kind:      Series;
      persona_kind:     Persona;
      post_status:      PostStatus;
      principle_kind:   Principle;
      speaker_kind:     Speaker;
      guard_level:      GuardLevel;
      guard_rule_kind:  GuardRuleKind;
      hashtag_category: HashtagCategory;
      photo_source:     PhotoSource;
    };
    CompositeTypes: { [_ in never]: never };
  };
}
