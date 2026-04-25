/**
 * Mealtap Field Ops — Database Types
 *
 * Hand-written TypeScript types that mirror the Supabase schema.
 * Nullability matches the SQL schema exactly.
 *
 * Update this file whenever schema migrations change.
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export type UserRole = 'agent' | 'field_lead' | 'admin'

export type LeadTag = 'hot' | 'warm' | 'cold' | 'not_a_fit'

export type CuisineType = 'Local' | 'Continental' | 'Fast Food' | 'Snacks' | 'Drinks' | 'Mixed'

export type DeliveryMethod = 'None' | 'Calls' | 'WhatsApp' | 'Chowdeck' | 'Glovo' | 'Bolt' | 'Other'

export type PayoutStatus = 'pending' | 'processing' | 'paid'

export type PayoutItemType = 'capture' | 'hot_lead' | 'salary'

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
  account_number: string | null
  account_name: string | null
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
  owner_name: string
  owner_phone: string
  address: string | null
  lat: number
  lng: number
  gps_accuracy_m: number | null
  location: string | null
  cuisine_type: CuisineType | null
  avg_meal_price_naira: number | null
  daily_order_volume_estimate: number | null
  currently_delivers: boolean
  delivery_method: DeliveryMethod | null
  has_smartphone: boolean
  has_bank_account: boolean
  has_pos: boolean
  owner_reaction: number | null
  tag: LeadTag
  notes: string | null
  captured_by: string
  zone_id: string | null
  quality_score: number | null
  quality_flags: string[] | null
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Table: restaurant_photos
// ---------------------------------------------------------------------------

export interface RestaurantPhoto {
  id: string
  restaurant_id: string
  photo_type: string
  storage_path: string
  uploaded_by: string
  created_at: string
}

// ---------------------------------------------------------------------------
// Table: onboardings (kept for backward compat — do not use for new features)
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
  conversion_status: 'pending' | 'converted' | 'failed'
  agent_id: string
  zone_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Table: payouts
// ---------------------------------------------------------------------------

export interface Payout {
  id: string
  agent_id: string
  period_start: string
  period_end: string
  total_captures: number
  total_hot_leads: number
  salary_amount: number
  hot_lead_bonus_amount: number
  deductions: number
  net_amount: number
  status: PayoutStatus
  paid_at: string | null
  paid_by: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Table: payout_items
// ---------------------------------------------------------------------------

export interface PayoutItem {
  id: string
  payout_id: string
  restaurant_id: string | null
  item_type: PayoutItemType
  amount: number
  created_at: string
}

// ---------------------------------------------------------------------------
// Table: app_settings
// ---------------------------------------------------------------------------

export interface AppSetting {
  key: string
  value: string
  updated_by: string | null
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
// ---------------------------------------------------------------------------

type NoRelationships = { Relationships: [] }

export type Database = {
  public: {
    Tables: {
      zones: {
        Row: Zone
        Insert: Omit<Zone, 'id' | 'created_at'> & Partial<Pick<Zone, 'id' | 'created_at'>>
        Update: Partial<Omit<Zone, 'id'>>
      } & NoRelationships
      users: {
        Row: User
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'> &
          Partial<Pick<User, 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Omit<User, 'id'>>
      } & NoRelationships
      restaurants: {
        Row: Restaurant
        Insert: Omit<Restaurant, 'id' | 'created_at' | 'updated_at'> &
          Partial<Pick<Restaurant, 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Omit<Restaurant, 'id'>>
      } & NoRelationships
      restaurant_photos: {
        Row: RestaurantPhoto
        Insert: Omit<RestaurantPhoto, 'id' | 'created_at'> & Partial<Pick<RestaurantPhoto, 'id' | 'created_at'>>
        Update: Partial<Omit<RestaurantPhoto, 'id'>>
      } & NoRelationships
      onboardings: {
        Row: Onboarding
        Insert: Omit<Onboarding, 'id' | 'created_at' | 'updated_at'> &
          Partial<Pick<Onboarding, 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Omit<Onboarding, 'id'>>
      } & NoRelationships
      payouts: {
        Row: Payout
        Insert: Omit<Payout, 'id' | 'created_at' | 'updated_at'> &
          Partial<Pick<Payout, 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Omit<Payout, 'id'>>
      } & NoRelationships
      payout_items: {
        Row: PayoutItem
        Insert: Omit<PayoutItem, 'id' | 'created_at'> & Partial<Pick<PayoutItem, 'id' | 'created_at'>>
        Update: Partial<Omit<PayoutItem, 'id'>>
      } & NoRelationships
      app_settings: {
        Row: AppSetting
        Insert: AppSetting
        Update: Partial<AppSetting>
      } & NoRelationships
      board_posts: {
        Row: BoardPost
        Insert: Omit<BoardPost, 'id' | 'created_at' | 'updated_at'> &
          Partial<Pick<BoardPost, 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Omit<BoardPost, 'id'>>
      } & NoRelationships
      board_reactions: {
        Row: BoardReaction
        Insert: Omit<BoardReaction, 'id' | 'created_at'> & Partial<Pick<BoardReaction, 'id' | 'created_at'>>
        Update: Partial<Omit<BoardReaction, 'id'>>
      } & NoRelationships
      dm_threads: {
        Row: DMThread
        Insert: Omit<DMThread, 'id' | 'created_at'> & Partial<Pick<DMThread, 'id' | 'created_at'>>
        Update: Partial<Omit<DMThread, 'id'>>
      } & NoRelationships
      dm_messages: {
        Row: DMMessage
        Insert: Omit<DMMessage, 'id' | 'sent_at'> & Partial<Pick<DMMessage, 'id' | 'sent_at'>>
        Update: Partial<Omit<DMMessage, 'id'>>
      } & NoRelationships
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    CompositeTypes: Record<string, never>
    Enums: {
      user_role: UserRole
      lead_tag: LeadTag
      payout_status: PayoutStatus
    }
  }
}
