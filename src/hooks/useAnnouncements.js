import { useEffect, useId, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const instanceId = useId()

  useEffect(() => {
    let active = true

    async function load() {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false })
      if (active) {
        setAnnouncements(data ?? [])
        setLoading(false)
      }
    }

    load()

    const channel = supabase
      .channel(`announcements-${instanceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, load)
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [instanceId])

  return { announcements, loading }
}
