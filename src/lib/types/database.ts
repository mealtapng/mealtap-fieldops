/**
 * Mealtap Field Ops — Database Types
 *
 * Hand-written TypeScript types that mirror supabase/migrations/001_initial_schema.sql.
 * Nullability matches the SQL schema exactly:
 *   - NOT NULL columns    → required (no | null)
 *   - Nullable columns    → T | null
 *   - timestamptz / date  → string  (Supabase returns ISO 8601 strings)
 *   - uuid                → string
 *   - jsonb               → Record<string, unknown> | null
 *   - geography(Point)    → string | null  (WKT or GeoJSON string from PostGIS)
 *   - numeric with DEFAULT but no NOT NULL → number | null
 *
 * Update this file whenever 001_initial_schema.sql changes.
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export type UserRole = 'agent' | 'field_lead' | 'admin'

export type LeadTag = 'hot' | 'warm' | 'cold' | 'not_a_fit'

export type DeliveryMethod =
  | 'none'
  | 'calls'
  | 'whatsapp'
  | 'chowdeck'
  | 'glovo'
  | 'bolt'
  | 'other'

export type PhotoType = 'storefront' | 'menu' | 'dish'

// ---------------------------------------------------------------------------
// Table: zones
// ---------------------------------------------------------------------------

export interface Zone {
  id: string
  name: string
  description: string | null
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
  start_date: string | null
  is_active: boolean
  quality_score: number | null
  failed_attempts: number
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Table: restaurants
// ---------------------------------------------------------------------------

export interface Restaurant {
  id: string
  name: string
  owner_name: string | null
  owner_phone: string | null
  address: string | null
  lat: number | null
  lng: number | null
  gps_accuracy_m: number | null
  location: string | null
  cuisine_type: string | null
  avg_meal_price_naira: number | null
  daily_order_volume_estimate: number | null
  currently_delivers: boolean | null
  delivery_method: DeliveryMethod
  has_smartphone: boolean | null
  has_bank_account: boolean | null
  has_pos: boolean | null
  owner_reaction: number | null
  tag: LeadTag | null
  notes: string | null
  captured_by: string
  zone_id: string | null
  quality_score: number | null
  quality_flags: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Table: restaurant_photos
// ---------------------------------------------------------------------------

export interface RestaurantPhoto {
  id: string
  restaurant_id: string
  photo_url: string
  photo_type: PhotoType
  uploaded_by: string | null
  created_at: string
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
// Table: capture_events
// ---------------------------------------------------------------------------

export interface CaptureEvent {
  id: string
  restaurant_id: string
  captured_by: string
  action: string
  payload: Record<string, unknown> | null
  created_at: string
}

// ---------------------------------------------------------------------------
// Database shape — Supabase-generated-style wrapper
// Allows createClient<Database>() for typed query results.
// ---------------------------------------------------------------------------

export type Database = {
  public: {
    Tables: {
      zones: {
        Row: Zone
        Insert: Omit<Zone, 'id' | 'created_at'> & Partial<Pick<Zone, 'id' | 'created_at'>>
        Update: Partial<Omit<Zone, 'id'>>
      }
      users: {
        Row: User
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'> &
          Partial<Pick<User, 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Omit<User, 'id'>>
      }
      restaurants: {
        Row: Restaurant
        Insert: Omit<Restaurant, 'id' | 'created_at' | 'updated_at'> &
          Partial<Pick<Restaurant, 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Omit<Restaurant, 'id'>>
      }
      restaurant_photos: {
        Row: RestaurantPhoto
        Insert: Omit<RestaurantPhoto, 'id' | 'created_at'> &
          Partial<Pick<RestaurantPhoto, 'id' | 'created_at'>>
        Update: Partial<Omit<RestaurantPhoto, 'id'>>
      }
      board_posts: {
        Row: BoardPost
        Insert: Omit<BoardPost, 'id' | 'created_at' | 'updated_at'> &
          Partial<Pick<BoardPost, 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Omit<BoardPost, 'id'>>
      }
      board_reactions: {
        Row: BoardReaction
        Insert: Omit<BoardReaction, 'id' | 'created_at'> &
          Partial<Pick<BoardReaction, 'id' | 'created_at'>>
        Update: Partial<Omit<BoardReaction, 'id'>>
      }
      dm_threads: {
        Row: DMThread
        Insert: Omit<DMThread, 'id' | 'created_at'> &
          Partial<Pick<DMThread, 'id' | 'created_at'>>
        Update: Partial<Omit<DMThread, 'id'>>
      }
      dm_messages: {
        Row: DMMessage
        Insert: Omit<DMMessage, 'id' | 'sent_at'> &
          Partial<Pick<DMMessage, 'id' | 'sent_at'>>
        Update: Partial<Omit<DMMessage, 'id'>>
      }
      capture_events: {
        Row: CaptureEvent
        Insert: Omit<CaptureEvent, 'id' | 'created_at'> &
          Partial<Pick<CaptureEvent, 'id' | 'created_at'>>
        Update: Partial<Omit<CaptureEvent, 'id'>>
      }
    }
    Enums: {
      user_role: UserRole
      lead_tag: LeadTag
      delivery_method: DeliveryMethod
    }
  }
}
