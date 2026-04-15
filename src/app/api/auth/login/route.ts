import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/env'
import { normalizePhone } from '@/lib/auth/phone'
import { validatePinFormat, verifyPin } from '@/lib/auth/pin'
import type { Database, User } from '@/lib/types/database'
import type { CookieOptions } from '@supabase/ssr'

type UserRow = Pick<
  User,
  'id' | 'phone' | 'pin_hash' | 'role' | 'full_name' | 'is_active' | 'failed_attempts'
>

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(request: NextRequest) {
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

  // ── 9. Issue Supabase session ──────────────────────────────────────────────
  // Collect cookies written by verifyOtp so we can attach them to the response.
  const pendingCookies: Array<{ name: string; value: string; options: CookieOptions }> = []

  const serverClient = createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(toSet) { pendingCookies.push(...toSet) },
    },
  })

  // Generate a magic-link token for the user's synthetic auth email.
  // No email is sent — we immediately exchange the token for a session.
  const authEmail = `${digits}@mealtap.internal`

  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email: authEmail,
  })

  if (linkError || !linkData?.properties?.hashed_token) {
    console.error('[login] generateLink error:', linkError)
    return err('Authentication error. Please try again.', 500)
  }

  const { error: otpError } = await serverClient.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: 'email',
  })

  if (otpError) {
    console.error('[login] verifyOtp error:', otpError)
    return err('Authentication error. Please try again.', 500)
  }

  // ── 10. Return success with session cookies ────────────────────────────────
  const response = NextResponse.json({ success: true, role: user.role })

  pendingCookies.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options)
  )

  return response
}
