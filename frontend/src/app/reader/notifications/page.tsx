'use client'
import { useEffect, useState, useCallback } from 'react'
import { notificationApi, ReaderNotification } from '@/lib/api'
import { Card, EmptyState, Skeleton } from '@/components/ui'
import { useRealtimeRefresh } from '@/hooks/useWebSocket'
import { Bell, Check, Clock, Mail, MailOpen } from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'

function NotificationItem({ notif, onMarkRead }: { notif: ReaderNotification; onMarkRead: (id: string) => void }) {
  return (
    <div
      className={cn(
        'flex items-start gap-4 px-6 py-4 transition-colors border-b border-slate-50 last:border-none',
        notif.read ? 'bg-white' : 'bg-amber-50/40',
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
          notif.read ? 'bg-slate-100 text-slate-400' : 'bg-amber-100 text-amber-600',
        )}
      >
        {notif.read ? <MailOpen className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm',
            notif.read ? 'text-slate-600' : 'text-slate-900 font-bold',
          )}
        >
          {notif.title}
        </p>
        <p className={cn(
          'text-sm mt-1 whitespace-pre-line leading-relaxed',
          notif.read ? 'text-slate-400' : 'text-slate-600',
        )}>
          {notif.content}
        </p>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(notif.createdAt)}
          </span>
        </div>
      </div>

      {/* Actions */}
      {!notif.read && (
        <button
          onClick={() => onMarkRead(notif.id)}
          className="shrink-0 w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all"
          title="Đánh dấu đã đọc"
        >
          <Check className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

export default function ReaderNotificationsPage() {
  const [notifications, setNotifications] = useState<ReaderNotification[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await notificationApi.mine()
      setNotifications(data)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Auto-refresh when new notification arrives via WebSocket
  useRealtimeRefresh('reader:notification', loadData)

  const handleMarkRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id)
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n)),
      )
    } catch {
      // silently fail
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-500" />
            Thông báo
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {unreadCount > 0
              ? `Bạn có ${unreadCount} thông báo chưa đọc`
              : 'Không có thông báo mới'}
          </p>
        </div>
      </div>

      {/* Notification list */}
      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48 rounded" />
                  <Skeleton className="h-3 w-full rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            title="Chưa có thông báo nào"
            description="Khi thư viện gửi thông báo, bạn sẽ thấy chúng ở đây."
            icon={
              <Bell className="w-12 h-12 text-amber-300" />
            }
          />
        ) : (
          <div className="divide-y divide-slate-50">
            {notifications.map(notif => (
              <NotificationItem
                key={notif.id}
                notif={notif}
                onMarkRead={handleMarkRead}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
