# Mealtap Field Ops

## What this is
Internal web app for Mealtap field agents to capture (onboard) restaurant vendors
across Abuja and Lagos. Agents visit restaurants, fill a 4-step capture wizard,
and tag each lead as Hot / Warm / Cold / Not a fit.

## Stack
Next.js 14 (App Router), Tailwind, shadcn/ui, Supabase (DB + Auth + Storage
+ Realtime), Mapbox GL, Poppins font, deployed on Vercel.

## Brand
Primary: Forest green #2D5A27 (dark #1F3F1B, light #E8F3EC).
Accent: Terracotta #C8622A (dark #A14F1F, light #FBEFE6).
Background: Cream #F5F5F0. Text: Ink #1A1A1A. Muted: #6B6B6B.
Borders/lines: #E5E5E0. Font: Poppins (400, 500, 600, 700).

Tailwind tokens: `forest`, `terra`, `cream`, `ink`, `muted`, `line`.

## Compensation model
- Weekly salary: ₦40,000 (fixed, not per capture — informational in UI)
- Hot lead bonus: ₦500 per restaurant tagged "hot"
- Both values are configurable via admin Settings → app_settings table
- Payouts page: admin marks salary + bonus as paid, records in payouts table
- Agents see their payout history in Profile → Payouts section

## Key rules
- Mobile-first. Agents are on mid-range Android with patchy data.
- Offline-tolerant: captures should save locally and sync on reconnect.
- Row-level security is enforced on every table. Never bypass it.
- No agent can see another agent's data. No agent can DM another agent.
- All writes go through authenticated Supabase client. No service role
  key on the client side, ever.

## Features preserved from earlier version
- Content Hub (asset library, DM threads, file attachments)
- PIN-masked login (4-digit PIN with 150ms reveal animation)
- Real-time DMs between agents and admin/field lead
- Board (announcement board) with reactions

## Out of scope (do not build without asking)
Route planning, push notifications, real-time rider dispatch, multi-city
expansion, photo auto-rejection, customer-facing features.
