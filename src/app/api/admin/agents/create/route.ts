import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/env'
import { normalizePhone } from '@/lib/auth/phone'
import { validatePinFormat, hashPin } from '@/lib/auth/pin'

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

const PREFIX_MAP: Record<string, string> = {
  agent:      'MT-FA',
  field_lead: 'MT-FL',
}

export async function POST(request: NextRequest) {
  // ── 1. Auth check — caller must be an admin ──────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('Unauthorized', 401)
  if (user.user_metadata?.role !== 'admin') return err('Forbidden', 403)

  // ── 2. Parse body ────────────────────────────────────────────────────────
  let body: { fullName?: unknown; phone?: unknown; role?: unknown; zoneId?: unknown; pin?: unknown }
  try {
    body = await request.json()
  } catch {
    return err('Invalid request body', 400)
  }

  const rawFullName = typeof body.fullName === 'string' ? body.fullName.trim() : ''
  const rawPhone    = typeof body.phone    === 'string' ? body.phone.trim()    : ''
  const rawRole     = typeof body.role     === 'string' ? body.role             : ''
  const rawZoneId   = typeof body.zoneId   === 'string' ? body.zoneId           : null
  const rawPin      = typeof body.pin      === 'string' && body.pin ? body.pin  : null

  if (!rawFullName) return err('Full name is required', 400)
  if (!rawPhone)    return err('Phone number is required', 400)
  if (!['agent', 'field_lead'].includes(rawRole)) return err('Role must be agent or field_lead', 400)
  if (rawPin && !validatePinFormat(rawPin)) return err('PIN must be exactly 4 digits', 400)

  // ── 3. Normalise phone ───────────────────────────────────────────────────
  let e164: string
  let digits: string
  try {
    ;({ e164, digits } = normalizePhone(rawPhone))
  } catch {
    return err('Invalid phone number — use Nigerian format (08..., 2348..., or +2348...)', 400)
  }

  // ── 4. Admin Supabase client (bypasses RLS) ──────────────────────────────
  const admin = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // ── 5. Duplicate phone check ─────────────────────────────────────────────
  const { data: existing } = await (admin as any)
    .from('users')
    .select('id')
    .eq('phone', e164)
    .maybeSingle()

  if (existing) return err('An agent with this phone number already exists', 409)

  // ── 6. Generate PIN ──────────────────────────────────────────────────────
  const pin = rawPin ?? String(Math.floor(Math.random() * 10000)).padStart(4, '0')

  // ── 7. Hash PIN ──────────────────────────────────────────────────────────
  const pinHash = await hashPin(pin)

  // ── 8. Generate employee ID ──────────────────────────────────────────────
  const prefix = PREFIX_MAP[rawRole]
  const { data: existingIds } = await (admin as any)
    .from('users')
    .select('employee_id')
    .like('employee_id', `${prefix}-%`)

  const numbers = ((existingIds ?? []) as Array<{ employee_id: string }>)
    .map(row => {
      const parts = row.employee_id.split('-')
      return parseInt(parts[parts.length - 1] ?? '0', 10)
    })
    .filter(n => !isNaN(n))

  const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1
  const employeeId = `${prefix}-${String(next).padStart(3, '0')}`

  // ── 9. Create auth user ──────────────────────────────────────────────────
  const authEmail = `${digits}@powerchat.internal`

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email:         authEmail,
    email_confirm: true,
    password:      'placeholder-replaced-below',
    user_metadata: { role: rawRole },
  })

  if (createError || !created.user) {
    console.error('[agents/create] createUser error:', createError?.message)
    return err('Failed to create auth user: ' + (createError?.message ?? 'unknown'), 500)
  }

  const userId = created.user.id

  // Set deterministic password = userId (never exposed to client)
  const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
    password:      userId,
    user_metadata: { role: rawRole },
  })

  if (updateError) {
    console.error('[agents/create] updateUserById error:', updateError.message)
    // Best-effort cleanup
    await admin.auth.admin.deleteUser(userId)
    return err('Failed to configure auth user', 500)
  }

  // ── 10. Insert public.users row ──────────────────────────────────────────
  const { error: insertError } = await (admin as any)
    .from('users')
    .insert({
      id:               userId,
      phone:            e164,
      pin_hash:         pinHash,
      role:             rawRole,
      employee_id:      employeeId,
      full_name:        rawFullName,
      assigned_zone_id: rawZoneId || null,
      is_active:        true,
      failed_attempts:  0,
    })

  if (insertError) {
    console.error('[agents/create] users insert error:', insertError.message)
    // Best-effort cleanup
    await admin.auth.admin.deleteUser(userId)
    return err('Failed to save agent profile: ' + insertError.message, 500)
  }

  // ── 11. Return PIN (shown once to admin) ─────────────────────────────────
  return NextResponse.json({ pin, employeeId }, { status: 201 })
}
