// Supabase Edge Function: request-password-reset
//
// Public, unauthenticated endpoint for the "Forgot password?" flow. A
// student who forgot their password can't sign in, and rarely remembers
// the exact login email their Admin set up for them, so this asks for the
// personal/contact email they saved on their account instead. It runs
// server-side with the service role to match that contact email back to
// an account, then immediately emails the real Supabase password-reset
// link to that account's login email — fully self-service, no Admin step.
//
// Always responds with a generic success message, matched or not, so the
// endpoint can't be used to enumerate which contact emails are on file.
//
// Deploy: supabase functions deploy request-password-reset
// Invoke from the client with supabase.functions.invoke('request-password-reset', ...)
// (supabase-js attaches the anon key as the bearer token automatically, which
// satisfies the platform's default JWT check even when nobody is signed in.)

import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const GENERIC_MESSAGE =
  "If that email matches an account, we've sent a password reset link to that account's login email."

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const contactEmail = typeof body.email === 'string' ? body.email.trim() : ''
  const redirectTo = typeof body.redirectTo === 'string' ? body.redirectTo : undefined
  if (!contactEmail) return json({ error: 'email is required' }, 400)

  try {
    const { data: match } = await admin
      .from('profiles')
      .select('id')
      .eq('role', 'student')
      .ilike('contact_email', contactEmail)
      .limit(1)
      .maybeSingle()

    if (match) {
      const { data: userData, error: getErr } = await admin.auth.admin.getUserById(match.id)
      if (getErr) {
        console.error('getUserById failed:', getErr.message)
      } else if (userData?.user?.email) {
        // resetPasswordForEmail sends to whatever address it's given, so it
        // has to be called with the account's real login email, not the
        // contact email the student just typed in — those are usually two
        // different addresses.
        const anonClient = createClient(SUPABASE_URL, ANON_KEY)
        const { error: resetErr } = await anonClient.auth.resetPasswordForEmail(userData.user.email, {
          redirectTo,
        })
        // Swallowed from the client response on purpose (same anti-enumeration
        // reasoning as above) but logged here so failures are actually visible
        // in Supabase's Edge Function logs instead of vanishing silently —
        // the most common cause is redirectTo not being on the project's
        // Auth > URL Configuration > Redirect URLs allow-list.
        if (resetErr) console.error('resetPasswordForEmail failed:', resetErr.message)
      }
    } else {
      console.log('No profile matched contact_email (this is expected/normal for unknown emails)')
    }

    return json({ success: true, message: GENERIC_MESSAGE })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Unexpected error' }, 500)
  }
})
