// Supabase Edge Function: manage-student
//
// Student accounts are never self-registered — only an Admin can create,
// reset, or remove them. Doing that requires the Auth Admin API, which
// needs the service_role key, so it has to run server-side here rather
// than in the browser.
//
// Deploy: supabase functions deploy manage-student
// Invoke from the client with supabase.functions.invoke('manage-student', ...)
// (the current admin session's JWT is attached automatically).

import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function randomTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let out = ''
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

  const authHeader = req.headers.get('Authorization') ?? ''

  // Client scoped to the caller's own JWT — used only to verify identity.
  const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: userData, error: userErr } = await callerClient.auth.getUser()
  if (userErr || !userData?.user) return json({ error: 'Not authenticated' }, 401)

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  const { data: callerProfile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single()

  if (callerProfile?.role !== 'admin') return json({ error: 'Admin access required' }, 403)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const action = body.action as string

  try {
    if (action === 'create') {
      const { full_name, student_number, email, password, section_id } = body as Record<string, string>
      if (!full_name || !student_number || !email) {
        return json({ error: 'full_name, student_number, and email are required' }, 400)
      }
      if (password && password.length < 8) {
        return json({ error: 'Password must be at least 8 characters long' }, 400)
      }

      // Admin can set the initial password explicitly; otherwise one is generated.
      const temp_password = password || randomTempPassword()

      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password: temp_password,
        email_confirm: true,
      })
      if (createErr) return json({ error: createErr.message }, 400)

      const { error: profileErr } = await admin.from('profiles').insert({
        id: created.user.id,
        role: 'student',
        full_name,
        student_number,
        section_id: section_id || null,
        must_change_password: true,
      })
      if (profileErr) {
        await admin.auth.admin.deleteUser(created.user.id)
        return json({ error: profileErr.message }, 400)
      }

      await admin.from('audit_log').insert({
        actor_id: userData.user.id,
        action: 'create_student',
        details: `Created ${full_name} (${student_number})`,
      })

      return json({ user_id: created.user.id, email, temp_password })
    }

    if (action === 'edit') {
      const { student_id, full_name, student_number, contact_number, section_id, email } = body as Record<
        string,
        string
      >
      if (!student_id || !full_name || !student_number) {
        return json({ error: 'student_id, full_name, and student_number are required' }, 400)
      }

      // Login email lives in auth.users, not profiles — changing it needs the
      // Auth Admin API (service role), same reason this whole function exists.
      if (email) {
        const { error: emailErr } = await admin.auth.admin.updateUserById(student_id, {
          email,
          email_confirm: true,
        })
        if (emailErr) return json({ error: emailErr.message }, 400)
      }

      const { error: updateErr } = await admin
        .from('profiles')
        .update({
          full_name,
          student_number,
          contact_number: contact_number || null,
          section_id: section_id || null,
        })
        .eq('id', student_id)
      if (updateErr) return json({ error: updateErr.message }, 400)

      await admin.from('audit_log').insert({
        actor_id: userData.user.id,
        action: 'edit_student',
        details: `Updated ${full_name} (${student_number})`,
      })

      return json({ success: true })
    }

    if (action === 'list_emails') {
      const emails: Record<string, string> = {}
      let page = 1
      while (true) {
        const { data: userList, error: listErr } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
        if (listErr) return json({ error: listErr.message }, 400)
        for (const u of userList.users) emails[u.id] = u.email ?? ''
        if (userList.users.length < 1000) break
        page += 1
      }
      return json({ emails })
    }

    if (action === 'reset_password') {
      const { student_id } = body as Record<string, string>
      if (!student_id) return json({ error: 'student_id is required' }, 400)

      const temp_password = randomTempPassword()
      const { error: pwErr } = await admin.auth.admin.updateUserById(student_id, {
        password: temp_password,
      })
      if (pwErr) return json({ error: pwErr.message }, 400)

      await admin.from('profiles').update({ must_change_password: true }).eq('id', student_id)

      await admin.from('audit_log').insert({
        actor_id: userData.user.id,
        action: 'reset_student_password',
        details: `Reset password for student ${student_id}`,
      })

      return json({ temp_password })
    }

    if (action === 'delete') {
      const { student_id } = body as Record<string, string>
      if (!student_id) return json({ error: 'student_id is required' }, 400)

      const { error: delErr } = await admin.auth.admin.deleteUser(student_id)
      if (delErr) return json({ error: delErr.message }, 400)

      await admin.from('audit_log').insert({
        actor_id: userData.user.id,
        action: 'delete_student',
        details: `Deleted student ${student_id}`,
      })

      return json({ success: true })
    }

    return json({ error: 'Unknown action' }, 400)
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Unexpected error' }, 500)
  }
})
