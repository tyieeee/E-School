import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill in your project values.'
  )
}

// "Remember me" on the student sign-in form controls whether the session
// survives a browser restart (localStorage) or is cleared when the tab
// closes (sessionStorage). Defaults to localStorage so every other sign-in
// path (admin login, first-login setup, etc.) keeps its prior behavior.
const rememberMeStorage = {
  getItem: (key) => {
    const store = localStorage.getItem('sb-remember-me') === 'false' ? sessionStorage : localStorage
    return store.getItem(key)
  },
  setItem: (key, value) => {
    const store = localStorage.getItem('sb-remember-me') === 'false' ? sessionStorage : localStorage
    store.setItem(key, value)
  },
  removeItem: (key) => {
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  },
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { storage: rememberMeStorage },
})
