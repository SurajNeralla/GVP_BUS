import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useNotifications } from '@/hooks/useNotifications'
import { Bell, Check, CheckCheck, Info, CheckCircle2, AlertTriangle, XCircle, Megaphone } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { NotificationType } from '@/types'

const typeConfig: Record<NotificationType, { icon: React.FC<any>; color: string; bg: string }> = {
  info: { icon: Info, color: 'hsl(199 89% 60%)', bg: 'hsl(199 89% 48% / 0.1)' },
  success: { icon: CheckCircle2, color: 'hsl(142 71% 60%)', bg: 'hsl(142 71% 45% / 0.1)' },
  warning: { icon: AlertTriangle, color: 'hsl(38 92% 60%)', bg: 'hsl(38 92% 50% / 0.1)' },
  error: { icon: XCircle, color: 'hsl(0 84% 65%)', bg: 'hsl(0 84% 60% / 0.1)' },
  announcement: { icon: Megaphone, color: 'hsl(262 83% 70%)', bg: 'hsl(262 83% 58% / 0.1)' },
}

export default function NotificationsPage() {
  const { profile } = useAuthStore()
  const { notifications, unreadCount, markRead, markAllRead, requestPushPermission } = useNotifications()
  const [pushGranted, setPushGranted] = useState(Notification.permission === 'granted')

  const handleEnablePush = async () => {
    const granted = await requestPushPermission()
    setPushGranted(granted)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'Hanken Grotesk', color: 'hsl(var(--text-primary))' }}>
            Notifications
          </h1>
          {unreadCount > 0 && (
            <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--text-muted))' }}>
              {unreadCount} unread
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!pushGranted && (
            <button
              onClick={handleEnablePush}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
              style={{ borderColor: 'hsl(var(--border-subtle))', color: 'hsl(var(--text-secondary))' }}
            >
              <Bell size={13} />
              Enable Push
            </button>
          )}
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{ background: 'hsl(var(--bg-card))', color: 'hsl(var(--text-secondary))' }}
            >
              <CheckCheck size={13} />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="card-glass p-12 text-center">
          <Bell size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2 stagger">
          {notifications.map((notif) => {
            const { icon: Icon, color, bg } = typeConfig[notif.type] ?? typeConfig.info
            return (
              <div
                key={notif.id}
                className="card p-4 flex items-start gap-3 cursor-pointer animate-fade-in"
                style={{
                  opacity: notif.read ? 0.7 : 1,
                  borderLeft: notif.read ? undefined : `3px solid ${color}`,
                }}
                onClick={() => !notif.read && markRead(notif.id)}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold" style={{ color: 'hsl(var(--text-primary))' }}>
                      {notif.title}
                    </p>
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ background: color }} />
                    )}
                  </div>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'hsl(var(--text-secondary))' }}>
                    {notif.message}
                  </p>
                  <p className="text-xs mt-1.5" style={{ color: 'hsl(var(--text-muted))' }}>
                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                  </p>
                </div>
                {notif.read && <Check size={14} style={{ color: 'hsl(var(--text-muted))' }} className="shrink-0 mt-0.5" />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
