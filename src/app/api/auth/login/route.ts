import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/env'
import { normalizePhone } from '@/lib/auth/phone'
import { validatePinFormat, verifyPin } from '@/lib/auth/pin'
import { checkRateLimit } from '@/lib/rate-limit'
import type { Database, User } from '@/lib/types/database'

type UserRow = Pick<
  User,
  'id' | 'phone' | 'pin_hash' | 'role' | 'full_name' | 'is_active' | 'failed_attempts'
>

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(request: NextRequest) {
  // ── 0. IP-based rate limiting ──────────────────────────────────────────────
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  const rl = checkRateLimit(ip, 10, 15 * 60 * 1000)

  if (!rl.allowed) {
    const res = NextResponse.json(
      { error: 'Too many login attempts. Please try again in 15 minutes.' },
      { status: 429 },
    )
    res.headers.set('X-RateLimit-Limit', '10')
    res.headers.set('X-RateLimit-Remaining', '0')
    res.headers.set('X-RateLimit-Reset', String(rl.resetAt))
    return res
  }

  // ── 1. Parse body ──────────────────────────────────────────────────────────
  let body: { phone?: unknown; pin?: unknown }
  try {
    body = await request.json()
  } catch {
    return err('Invalid request body', 400)
  }

  const rawPhone = typeof body.phone === 'string' ? body.phone.trim() : ''
  const rawPin   = typeof body.pin   === 'string' ? body.pin.trim()   : ''

  if (!rawPhone || !rawPin) {
    return err('Phone and PIN are required', 400)
  }

  // ── 2. Validate PIN format ─────────────────────────────────────────────────
  if (!validatePinFormat(rawPin)) {
    return err('PIN must be exactly 4 digits', 400)
  }

  // ── 3. Normalise phone ─────────────────────────────────────────────────────
  let e164: string
  let digits: string
  try {
    ;({ e164, digits } = normalizePhone(rawPhone))
  } catch {
    return err('Invalid phone number', 400)
  }

  // ── 4. Admin client (bypasses RLS, no session) ─────────────────────────────
  const adminClient = createSupabaseClient<Database>(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // ── 5. Look up user by phone ───────────────────────────────────────────────
  // Explicit cast: hand-rolled Database types don't satisfy Supabase's full
  // generic constraints, so column inference returns `never` without it.
  const { data: user, error: userError } = await adminClient
    .from('users')
    .select('id, phone, pin_hash, role, full_name, is_active, failed_attempts')
    .eq('phone', e164)
    .single() as { data: UserRow | null; error: Error | null }

  if (userError || !user) {
    // Do not reveal whether the phone exists
    return err('Invalid phone or PIN', 401)
  }

  // ── 6. Account status checks ───────────────────────────────────────────────
  if (!user.is_active) {
    return err('Account inactive. Contact your field lead.', 403)
  }

  if (user.failed_attempts >= 5) {
    return err('Account locked. Contact your field lead.', 403)
  }

  // ── 7. Verify PIN ──────────────────────────────────────────────────────────
  const pinValid = await verifyPin(rawPin, user.pin_hash)

  if (!pinValid) {
    // Increment failed attempts without revealing which check failed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (adminClient as any)
      .from('users')
      .update({ failed_attempts: user.failed_attempts + 1 })
      .eq('id', user.id)

    return err('Invalid phone or PIN', 401)
  }

  // ── 8. PIN correct — reset failed attempts ─────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (adminClient as any)
    .from('users')
    .update({ failed_attempts: 0 })
    .eq('id', user.id)

  // ── 9a. Embed role in user_metadata so JWT carries it for middleware ─────────
  // Middleware reads user.user_metadata.role to make routing decisions without
  // a DB query on every request. Must happen before signInWithPassword so the
  // freshly-issued JWT already contains the role.
  await adminClient.auth.admin.updateUserById(user.id, {
    user_metadata: { role: user.role },
  })

  // ── 9. Issue Supabase session ──────────────────────────────────────────────
  // Collect cookies written by signInWithPassword so we can attach them to the response.
  const pendingCookies: Array<{ name: string; value: string; options: object }> = []

  const serverClient = createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(toSet) { pendingCookies.push(...toSet) },
    },
  })

  // Sign in using synthetic email + UUID as password.
  // The UUID is deterministic but never exposed to the client.
  const authEmail = `${digits}@powerchat.internal`

  const { error: signInError } = await serverClient.auth.signInWithPassword({
    email: authEmail,
    password: user.id,
  })

  if (signInError) {
    console.error('[login] signInWithPassword error:', signInError)
    return err('Authentication error. Please try again.', 500)
  }

  // ── 10. Return success with session cookies ────────────────────────────────
  const response = NextResponse.json({ success: true, role: user.role })
  response.headers.set('X-RateLimit-Limit', '10')
  response.headers.set('X-RateLimit-Remaining', String(rl.remaining))
  response.headers.set('X-RateLimit-Reset', String(rl.resetAt))

  pendingCookies.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options)
  )

  return response
}
