import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useNotificationStore } from '@/store/notificationStore'
import { useAuthStore } from '@/store/authStore'
import type { Notification } from '@/types'

export function useNotifications() {
  const { user } = useAuthStore()
  const { notifications, unreadCount, setNotifications, addNotification, markAsRead, markAllAsRead } = useNotificationStore()

  useEffect(() => {
    if (!user) return

    // Initial fetch
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setNotifications(data as Notification[])
      })

    // Realtime new notifications
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notif = payload.new as Notification
          addNotification(notif)
          // Trigger browser push notification if permission granted
          if (Notification.permission === 'granted') {
            new Notification(notif.title, {
              body: notif.message,
              icon: '/icons/icon-192x192.png',
              badge: '/icons/icon-72x72.png',
              tag: notif.id,
            })
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user, setNotifications, addNotification])

  const markRead = async (id: string) => {
    markAsRead(id)
    await supabase.from('notifications').update({ read: true }).eq('id', id)
  }

  const markAllRead = async () => {
    markAllAsRead()
    if (user) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)
    }
  }

  const requestPushPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return false
  }

  return { notifications, unreadCount, markRead, markAllRead, requestPushPermission }
}
