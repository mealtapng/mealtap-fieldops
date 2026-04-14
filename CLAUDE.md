# Mealtap Field Ops

## What this is
Internal web app for Mealtap field agents to capture Abuja restaurant data
before our WhatsApp-native food delivery platform launches.

## Stack
Next.js 14 (App Router), Tailwind, shadcn/ui, Supabase (DB + Auth + Storage
+ Realtime), Mapbox GL, Poppins font, deployed on Vercel.

## Brand
Primary: Forest Green #2D5A27. Secondary: Terracotta #C8622A.
Background: Cream #F5F5F0. Font: Poppins.

## Key rules
- Mobile-first. Agents are on mid-range Android with patchy data.
- Offline-tolerant: captures must save locally and sync on reconnect.
- Row-level security is enforced on every table. Never bypass it.
- No agent can see another agent's data. No agent can DM another agent.
- All writes go through authenticated Supabase client. No service role
  key on the client side, ever.

## Out of scope (do not build without asking)
Route planning, push notifications, in-app payouts, multi-city, photo
auto-rejection, real-time rider dispatch.
