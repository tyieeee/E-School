import { useEffect, useId, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export function useUnreadMessages() {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const instanceId = useId()

  useEffect(() => {
    if (!user) return
    let active = true

    async function load() {
      const { count } = await supabase
        .from('direct_messages')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', user.id)
        .eq('read', false)
        .neq('sender_id', user.id)
      if (active) setUnreadCount(count ?? 0)
    }

    load()

    const channel = supabase
      .channel(`unread-messages-${instanceId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'direct_messages', filter: `student_id=eq.${user.id}` },
        load
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [user, instanceId])

  return unreadCount
}
