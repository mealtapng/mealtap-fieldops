# Mealtap Field Ops

Internal web app for Mealtap field agents to capture Abuja restaurant data. Built with Next.js 14 (App Router), Tailwind CSS, shadcn/ui, and Supabase.

## Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui (new-york)
- **Backend:** Supabase (Postgres + PostGIS, Auth, Storage, Realtime)
- **Font:** Poppins (Google Fonts)
- **Deployment:** Vercel

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database Migrations

Migrations live in `supabase/migrations/`. They must be run **in order** via the Supabase SQL Editor — there is no CLI runner set up yet.

### Prerequisites
- Supabase project created
- `uuid-ossp` extension enabled (`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`)
- `postgis` extension enabled (`CREATE EXTENSION IF NOT EXISTS postgis;`)

### Step 1 — Run the initial schema

1. Open your Supabase project → **SQL Editor**
2. Click **New query**
3. Paste the full contents of `supabase/migrations/001_initial_schema.sql`
4. Click **Run**
5. Verify: go to **Table Editor** — you should see all 9 tables:
   `zones`, `users`, `restaurants`, `restaurant_photos`, `board_posts`,
   `board_reactions`, `dm_threads`, `dm_messages`, `capture_events`

**Optional verification queries:**
```sql
-- Check all tables were created
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Check enums were created
SELECT typname, enumlabel
FROM pg_enum
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
ORDER BY typname, enumsortorder;

-- Check indexes
SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public';
```

### Step 2 — Run RLS policies

1. In the SQL Editor, open a **new query**
2. Paste the full contents of `supabase/migrations/002_rls_policies.sql`
3. Click **Run**
4. Verify: go to **Authentication → Policies** — you should see policies on:
   `users`, `restaurants`, `restaurant_photos`, `board_posts`, `dm_threads`, `dm_messages`

### Do not re-run migrations

Each migration file is designed to be run once against a clean database. Re-running will produce "already exists" errors. If you need to reset, truncate or drop via the Supabase dashboard first.

## Creating users

Users must be created through the CLI script — never via raw SQL. Direct inserts into `auth.users` leave required GoTrue fields in a broken state and will cause all auth operations to fail.

```bash
npm run create-user -- --phone <number> --name "<name>" --role <role> [options]
```

**Required:**
- `--phone` — Nigerian phone number (`08...`, `2348...`, or `+2348...`)
- `--name` — Full name (quote names with spaces)
- `--role` — `agent`, `field_lead`, or `admin`

**Optional:**
- `--pin` — 4-digit PIN (auto-generated and printed if omitted)
- `--zone` — Zone name to assign (case-insensitive, must match a row in the `zones` table)
- `--employee-id` — Override the auto-generated employee ID (e.g. `MT-FA-007`)

**Examples:**

```bash
# Create a field agent — PIN auto-generated
npm run create-user -- --phone 08039606540 --name "Amaka Obi" --role agent

# Create a field lead with a zone
npm run create-user -- --phone 08055001234 --name "Tunde Bello" --role field_lead --zone "Wuse 2"

# Create an agent with a specific PIN
npm run create-user -- --phone 08071112222 --name "Chisom Eze" --role agent --pin 4821
```

The script prints the PIN at the end — copy it to send to the agent via WhatsApp. Employee IDs are auto-incremented per role (`MT-FA-001`, `MT-FA-002`, …).
