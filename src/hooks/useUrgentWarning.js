import { useEffect, useId, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Tracks the single active urgent warning (if any), staying in sync via
// Realtime so it appears instantly on every logged-in screen and is also
// picked up by students who log in while one is already active.
export function useUrgentWarning() {
  const [warning, setWarning] = useState(null)
  const [loading, setLoading] = useState(true)
  const instanceId = useId()

  useEffect(() => {
    let active = true

    async function fetchActive() {
      const { data } = await supabase
        .from('urgent_warnings')
        .select('*')
        .eq('is_active', true)
        .order('triggered_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (active) {
        setWarning(data ?? null)
        setLoading(false)
      }
    }

    fetchActive()

    const channel = supabase
      .channel(`urgent-warnings-realtime-${instanceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'urgent_warnings' }, (payload) => {
        const row = payload.new && Object.keys(payload.new).length ? payload.new : payload.old
        if (row?.is_active) {
          setWarning(row)
        } else {
          setWarning((current) => (current?.id === row?.id ? null : current))
        }
      })
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [instanceId])

  return { warning, loading }
}
