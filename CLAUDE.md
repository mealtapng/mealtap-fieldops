# PowerChat Field Ops

## What this is
Internal web app for PowerChat field agents to onboard Abuja and Lagos
residents to purchase electricity tokens via the PowerChat WhatsApp platform.

## Stack
Next.js 14 (App Router), Tailwind, shadcn/ui, Supabase (DB + Auth + Storage
+ Realtime), Mapbox GL, Poppins font, deployed on Vercel.

## Brand
Primary: PowerChat Blue #1A73E8. Secondary: Success Green #34A853.
Background: Light Grey #F8F9FA. Font: Poppins.

## Key rules
- Mobile-first. Agents are on mid-range Android with patchy data.
- Offline-tolerant: onboardings must save locally and sync on reconnect.
- Row-level security is enforced on every table. Never bypass it.
- No agent can see another agent's data. No agent can DM another agent.
- All writes go through authenticated Supabase client. No service role
  key on the client side, ever.

## Out of scope (do not build without asking)
Route planning, push notifications, in-app payouts, multi-city, photo
auto-rejection, real-time rider dispatch, restaurant/food features.
