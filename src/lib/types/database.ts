/**
 * PowerChat Field Ops — Database Types
 *
 * Hand-written TypeScript types that mirror supabase/migrations/003_powerchat_schema.sql.
 * Nullability matches the SQL schema exactly:
 *   - NOT NULL columns    → required (no | null)
 *   - Nullable columns    → T | null
 *   - timestamptz / date  → string  (Supabase returns ISO 8601 strings)
 *   - uuid                → string
 *   - jsonb               → Record<string, unknown> | null
 *   - geography(Point)    → string | null  (WKT or GeoJSON string from PostGIS)
 *   - numeric with DEFAULT but no NOT NULL → number | null
 *
 * Update this file whenever the schema migrations change.
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export type UserRole = 'agent' | 'field_lead' | 'admin'

export type ConversionStatus = 'pending' | 'converted' | 'failed'

// ---------------------------------------------------------------------------
// Table: zones
// ---------------------------------------------------------------------------

export interface Zone {
  id: string
  name: string
  label: string | null
  center_lat: number | null
  center_lng: number | null
  radius_km: number
  created_at: string
}

// ---------------------------------------------------------------------------
// Table: users
// ---------------------------------------------------------------------------

export interface User {
  id: string
  phone: string
  pin_hash: string
  role: UserRole
  employee_id: string
  full_name: string
  passport_photo_url: string | null
  email: string | null
  date_of_birth: string | null
  home_address: string | null
  nin_last_4: string | null
  next_of_kin_name: string | null
  next_of_kin_phone: string | null
  bank_name: string | null
  bank_account_masked: string | null
  assigned_zone_id: string | null
  referral_code: string | null
  start_date: string | null
  is_active: boolean
  quality_score: number | null
  failed_attempts: number
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Table: onboardings
// ---------------------------------------------------------------------------

export interface Onboarding {
  id: string
  user_phone: string
  user_name: string
  meter_number: string | null
  disco_area: string
  lat: number
  lng: number
  gps_accuracy_m: number | null
  location: string | null
  address: string | null
  referral_code: string
  conversion_status: ConversionStatus
  checklist_saved_number: boolean | null
  checklist_sent_hi: boolean | null
  checklist_entered_code: boolean | null
  checklist_purchased_token: boolean | null
  token_amount_purchased: number | null
  agent_id: string
  zone_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Table: board_posts
// ---------------------------------------------------------------------------

export interface BoardPost {
  id: string
  title: string
  body: string
  posted_by: string
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Table: board_reactions
// ---------------------------------------------------------------------------

export interface BoardReaction {
  id: string
  post_id: string
  user_id: string
  emoji: string
  created_at: string
}

// ---------------------------------------------------------------------------
// Table: dm_threads
// ---------------------------------------------------------------------------

export interface DMThread {
  id: string
  agent_id: string
  supervisor_id: string
  created_at: string
}

// ---------------------------------------------------------------------------
// Table: dm_messages
// ---------------------------------------------------------------------------

export interface DMMessage {
  id: string
  thread_id: string
  sender_id: string
  body: string
  sent_at: string
  read_at: string | null
}

// ---------------------------------------------------------------------------
// Database shape — Supabase-generated-style wrapper
// Allows createClient<Database>() for typed query results.
// ---------------------------------------------------------------------------

// Each table entry needs Relationships for Supabase's TypeScript generics
// to infer column types correctly (without it, .select() returns `never`).
type NoRelationships = { Relationships: [] }

export type Database = {
  public: {
    Tables: {
      zones: {
        Row: Zone
        Insert: Omit<Zone, 'id' | 'created_at'> &
          Partial<Pick<Zone, 'id' | 'created_at'>>
        Update: Partial<Omit<Zone, 'id'>>
      } & NoRelationships
      users: {
        Row: User
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'> &
          Partial<Pick<User, 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Omit<User, 'id'>>
      } & NoRelationships
      onboardings: {
        Row: Onboarding
        Insert: Omit<Onboarding, 'id' | 'created_at' | 'updated_at'> &
          Partial<Pick<Onboarding, 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Omit<Onboarding, 'id'>>
      } & NoRelationships
      board_posts: {
        Row: BoardPost
        Insert: Omit<BoardPost, 'id' | 'created_at' | 'updated_at'> &
          Partial<Pick<BoardPost, 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Omit<BoardPost, 'id'>>
      } & NoRelationships
      board_reactions: {
        Row: BoardReaction
        Insert: Omit<BoardReaction, 'id' | 'created_at'> &
          Partial<Pick<BoardReaction, 'id' | 'created_at'>>
        Update: Partial<Omit<BoardReaction, 'id'>>
      } & NoRelationships
      dm_threads: {
        Row: DMThread
        Insert: Omit<DMThread, 'id' | 'created_at'> &
          Partial<Pick<DMThread, 'id' | 'created_at'>>
        Update: Partial<Omit<DMThread, 'id'>>
      } & NoRelationships
      dm_messages: {
        Row: DMMessage
        Insert: Omit<DMMessage, 'id' | 'sent_at'> &
          Partial<Pick<DMMessage, 'id' | 'sent_at'>>
        Update: Partial<Omit<DMMessage, 'id'>>
      } & NoRelationships
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    CompositeTypes: Record<string, never>
    Enums: {
      user_role: UserRole
      conversion_status: ConversionStatus
    }
  }
}
