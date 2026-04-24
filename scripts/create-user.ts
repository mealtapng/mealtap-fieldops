#!/usr/bin/env tsx
/**
 * Create a new Mealtap Field Ops user.
 *
 * Usage:
 *   npm run create-user -- --phone 08012345678 --name "Amaka Obi" --role agent
 *   npm run create-user -- --phone 08012345678 --name "Tunde Bello" --role field_lead --zone "Wuse 2"
 *   npm run create-user -- --phone 08012345678 --name "Amaka Obi" --role agent --pin 4821
 *
 * Options:
 *   --phone        Nigerian phone number (required)
 *   --name         Full name (required)
 *   --role         agent | field_lead | admin (required)
 *   --pin          4-digit PIN — auto-generated if omitted
 *   --employee-id  Override the auto-generated employee ID
 *   --zone         Zone name to assign (case-insensitive, must match zones table)
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { normalizePhone } from '../src/lib/auth/phone'
import { validatePinFormat, hashPin } from '../src/lib/auth/pin'

// ── Argument parsing ──────────────────────────────────────────────────────────

function getArg(name: string): string | undefined {
  const flag = `--${name}`
  const idx = process.argv.indexOf(flag)
  if (idx === -1) return undefined
  const val = process.argv[idx + 1]
  return val && !val.startsWith('--') ? val : undefined
}

function requireArg(name: string): string {
  const val = getArg(name)
  if (!val) {
    console.error(`\nError: --${name} is required\n`)
    printUsage()
    process.exit(1)
  }
  return val
}

function printUsage() {
  console.error(
    'Usage:\n' +
    '  npm run create-user -- --phone <number> --name "<name>" --role <role> [options]\n\n' +
    'Options:\n' +
    '  --phone        Nigerian phone number (08..., 2348..., or +2348...)\n' +
    '  --name         Full name (quote names with spaces)\n' +
    '  --role         agent | field_lead | admin\n' +
    '  --pin          4-digit PIN (auto-generated if omitted)\n' +
    '  --employee-id  Override auto-generated employee ID (e.g. MT-FA-007)\n' +
    '  --zone         Zone name to assign (must match a row in the zones table)\n'
  )
}

const rawPhone = requireArg('phone')
const fullName = requireArg('name')
const rawRole  = requireArg('role')
const rawPin   = getArg('pin')
const rawEmpId = getArg('employee-id')
const zoneName = getArg('zone')

// ── Validate role ─────────────────────────────────────────────────────────────

const VALID_ROLES = ['agent', 'field_lead', 'admin', 'content_manager'] as const
type Role = (typeof VALID_ROLES)[number]

if (!(VALID_ROLES as readonly string[]).includes(rawRole)) {
  console.error(`\nError: --role must be one of: ${VALID_ROLES.join(', ')}\n`)
  process.exit(1)
}
const role = rawRole as Role

// ── Validate phone ────────────────────────────────────────────────────────────

let e164: string
let digits: string
try {
  ;({ e164, digits } = normalizePhone(rawPhone))
} catch (err) {
  console.error(`\nError: ${(err as Error).message}\n`)
  process.exit(1)
}

// ── Validate / generate PIN ───────────────────────────────────────────────────

let pin: string
if (rawPin) {
  if (!validatePinFormat(rawPin)) {
    console.error('\nError: --pin must be exactly 4 digits (e.g. 4821)\n')
    process.exit(1)
  }
  pin = rawPin
} else {
  pin = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
}

// ── Supabase admin client ─────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    '\nError: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.\n' +
    'Make sure .env.local exists and contains these variables.\n'
  )
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // ── Resolve zone ────────────────────────────────────────────────────────────

  let zoneId: string | null = null
  let resolvedZoneName: string | null = null

  if (zoneName) {
    const { data: zones, error: zoneError } = await admin
      .from('zones')
      .select('id, name')
      .ilike('name', zoneName)
      .limit(1)

    if (zoneError || !zones?.length) {
      console.error(`\nError: Zone "${zoneName}" not found.\n`)
      const { data: allZones } = await admin.from('zones').select('name').order('name')
      if (allZones?.length) {
        console.error('Available zones:')
        allZones.forEach((z: { name: string }) => console.error(`  ${z.name}`))
      }
      console.error()
      process.exit(1)
    }

    zoneId = zones[0].id
    resolvedZoneName = zones[0].name
  }

  // ── Auto-generate employee ID ────────────────────────────────────────────────

  const PREFIX_MAP: Record<Role, string> = {
    agent:           'MT-FA',
    field_lead:      'MT-FL',
    admin:           'MT-AD',
    content_manager: 'PC-CM',
  }
  const prefix = PREFIX_MAP[role]

  let employeeId: string

  if (rawEmpId) {
    employeeId = rawEmpId
  } else {
    const { data: existing } = await admin
      .from('users')
      .select('employee_id')
      .like('employee_id', `${prefix}-%`)

    const numbers = (existing ?? [])
      .map((row: { employee_id: string }) => {
        const parts = row.employee_id.split('-')
        return parseInt(parts[parts.length - 1] ?? '0', 10)
      })
      .filter((n: number) => !isNaN(n))

    const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1
    employeeId = `${prefix}-${String(next).padStart(3, '0')}`
  }

  // ── Hash PIN ─────────────────────────────────────────────────────────────────

  console.log('\nHashing PIN…')
  const pinHash = await hashPin(pin)

  // ── Create auth user ─────────────────────────────────────────────────────────

  const authEmail = `${digits}@mealtap.internal`
  console.log(`Creating auth user: ${authEmail}`)

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: authEmail,
    email_confirm: true,
    password: 'placeholder-replaced-below',
    user_metadata: { role },
  })

  if (createError || !created.user) {
    console.error('\nError creating auth user:', createError?.message ?? 'unknown error')
    process.exit(1)
  }

  const userId = created.user.id

  // Set password = userId — deterministic, never shown to anyone
  const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
    password: userId,
    user_metadata: { role },
  })

  if (updateError) {
    console.error('\nError setting auth user password:', updateError.message)
    console.error(
      `\nClean up the orphaned auth record:\n` +
      `  DELETE FROM auth.users WHERE id = '${userId}';`
    )
    process.exit(1)
  }

  // ── Insert public.users row ──────────────────────────────────────────────────

  const { error: insertError } = await admin
    .from('users')
    .insert({
      id: userId,
      phone: e164,
      pin_hash: pinHash,
      role,
      employee_id: employeeId,
      full_name: fullName,
      assigned_zone_id: zoneId,
      is_active: true,
      failed_attempts: 0,
    })

  if (insertError) {
    console.error('\nError inserting public.users row:', insertError.message)
    console.error(
      '\nAuth user was created but public.users insert failed.' +
      '\nClean up manually:\n' +
      `  DELETE FROM auth.users WHERE id = '${userId}';`
    )
    process.exit(1)
  }

  // ── Success ──────────────────────────────────────────────────────────────────

  const line = '─'.repeat(42)
  const defaultUrl = role === 'content_manager' ? 'field.powerchat.ng/content-hub' : 'field.powerchat.ng/dashboard'
  console.log(`
✓ User created successfully
${line}
  Name:         ${fullName}
  Phone:        ${e164}
  Role:         ${role}
  Employee ID:  ${employeeId}
  Zone:         ${resolvedZoneName ?? '—'}
  Login URL:    ${defaultUrl}
${line}
  PIN: ${pin}  ← send to user via WhatsApp
${line}
`)
}

main().catch(err => {
  console.error('\nUnexpected error:', err)
  process.exit(1)
})
