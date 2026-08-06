# E-School

A school safety and communication system with two roles — **Admin** and **Student**. Students
never self-register; the Admin creates every student account. Students can privately report
safety concerns, read school announcements, receive direct messages from the Admin, and see an
instant full-screen alert if the Admin triggers an **Urgent Warning**.

## Tech stack

- **Frontend:** React 19 (Vite) + Tailwind CSS v4
- **Backend / DB / Auth:** Supabase (Postgres, Auth, Storage, Realtime)
- **Privileged admin actions** (creating/deleting/resetting student accounts) run in a Supabase
  Edge Function, because they require the `service_role` key, which must never be shipped to the
  browser.

## Project structure

```
src/
  lib/supabaseClient.js       Supabase client (anon key)
  context/AuthContext.jsx     Session + profile (role) state
  components/                 ProtectedRoute, layouts, Button/Card/ConfirmModal, urgent overlay
  hooks/useUrgentWarning.js   Realtime-synced active urgent warning
  pages/student/              Login, FirstLoginSetup, Dashboard, Report, Inbox
  pages/admin/                Login, Dashboard, Students, Reports, Announcements, Messages, UrgentWarning
supabase/
  schema.sql                  Tables, RLS policies, storage bucket, realtime publication
  functions/manage-student/   Edge Function: create / reset-password / delete student accounts
```

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

Create a project at [supabase.com](https://supabase.com), then in **Authentication → Providers**
disable **Allow new users to sign up** — accounts are Admin-created only.

### 3. Run the schema

Open the SQL editor in your Supabase project and run the contents of `supabase/schema.sql`. This
creates all tables, RLS policies, the private `report-evidence` storage bucket, and enables
Realtime on `urgent_warnings`, `announcements`, and `direct_messages`.

### 4. Deploy the `manage-student` Edge Function

This function lets the Admin dashboard create, reset the password for, and delete student
accounts, using the service role key server-side (never exposed to the browser).

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase functions deploy manage-student
```

The function automatically has access to `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` — no
extra secrets to set.

### 5. Seed the Admin account

1. In the Supabase dashboard, go to **Authentication → Users → Add user** and create the admin's
   email + password (check "Auto confirm user").
2. Copy the generated user UUID.
3. In the SQL editor, run:

   ```sql
   insert into profiles (id, role, full_name, must_change_password)
   values ('<paste-uuid-here>', 'admin', 'School Admin', false)
   on conflict (id) do update set role = 'admin';
   ```

### 6. Configure environment variables

```bash
cp .env.example .env
```

Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from **Project Settings → API**.

### 7. Run it

```bash
npm run dev
```

- Admin signs in at `/admin/login` with the account seeded in step 5.
- From **Students**, the Admin creates a student account (full name, student number, email) and
  receives a one-time temporary password to hand off.
- The student signs in at `/login` with that email + temp password, then is forced to set a new
  password and provide a contact number before reaching their dashboard.

## How account "usernames" work

Supabase Auth identifies users by email, so the email the Admin enters when creating a student is
that student's sign-in username. The temporary password shown after creation (or after a
password reset) should be communicated to the student out of band (in person, printed slip, etc.)
— it is never stored anywhere after that one-time display.

## Security notes

- Row Level Security enforces: students can only read/write their own reports, only read their
  own direct messages, and can never see other students' reports.
- Report photos live in a **private** storage bucket; only the uploading student and Admins can
  read them, and the Admin dashboard views them via short-lived signed URLs.
- `profiles.role` and `profiles.student_number` are not student-writable — only `contact_number`,
  `full_name`, and `must_change_password` are grantable columns for the student's own row.
- All privileged account-management actions are re-verified server-side in the Edge Function
  (it re-checks the caller's role from `profiles`, ignoring anything the client claims).
