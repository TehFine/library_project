'use client'
import { useEffect, useState, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import ReaderSidebar from '@/components/layout/ReaderSidebar'
import TopBar from '@/components/layout/TopBar'
import MobileDrawer from '@/components/layout/MobileDrawer'
import { authApi, notificationApi } from '@/lib/api'
import { User } from '@/types'
import { useToast } from '@/hooks/useToast'
import { useWebSocket } from '@/hooks/useWebSocket'

export default function ReaderLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()

  // Fetch unread notification count
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return
    try {
      const { count } = await notificationApi.getUnreadCount()
      setUnreadCount(count)
    } catch {
      // silently fail
    }
  }, [user])

  // Initial fetch + refetch when user changes
  useEffect(() => {
    fetchUnreadCount()
  }, [fetchUnreadCount])

  // Refetch unread count when navigating to notifications page
  // (since user may have marked some as read)
  useEffect(() => {
    if (pathname === '/reader/notifications') {
      fetchUnreadCount()
    }
  }, [pathname, fetchUnreadCount])

  // Real-time notification: show toast AND update badge when admin sends a notification
  const handleNotification = useCallback((data?: { title: string; content: string; targetUserIds?: string[] }) => {
    if (!user) return
    // Only show toast if this notification is targeted at the current user
    if (data?.targetUserIds && !data.targetUserIds.includes(user.id)) return
    toast(data?.title || 'Bạn có thông báo mới từ thư viện', 'info')
    // Refetch unread count to keep badge in sync
    fetchUnreadCount()
    // Dispatch a window event so the notifications page (if open) can refresh without a separate socket connection
    window.dispatchEvent(new CustomEvent('reader-notification-ws', { detail: data }))
  }, [user, toast, fetchUnreadCount])
  useWebSocket<{ title: string; content: string; targetUserIds?: string[] }>('reader:notification', handleNotification, !!user)

  useEffect(() => {
    authApi.me()
      .then(u => {
        setUser(u)
        setLoading(false)
      })
      .catch(() => {
        setUser(null)
        setLoading(false)
      })
  }, [])

  // Bảo vệ các route (ngoại trừ danh sách sách và chi tiết sách)
  useEffect(() => {
    if (loading) return
    
    // Kiểm tra xem đường dẫn hiện tại có thuộc diện công khai không
    const isPublic = /\/reader\/books($|\/)/.test(pathname) || pathname.startsWith('/auth') || pathname === '/'
    
    console.log('[Auth Guard] Path:', pathname, 'isPublic:', isPublic, 'User:', !!user)

    if (!user && !isPublic) {
      console.log('[Auth Guard] Redirecting to login...')
      router.push('/auth/login')
    }
  }, [user, loading, pathname, router])

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-amber-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const isGuest = !user

  return (
    /*
     * Full-screen amber shell — fixed, no scroll on the outer frame
     */
    <div
      className="h-screen w-screen flex overflow-hidden p-2 sm:p-4 gap-2 sm:gap-3"
      style={{ background: '#F5E6CC' }}
    >
      {/* ── Sidebar — hidden on mobile ── */}
      <div className="hidden md:block h-full">
        <ReaderSidebar isGuest={isGuest} unreadCount={unreadCount} />
      </div>

      {/* ── Right column — TopBar + white card ── */}
      <div className="flex-1 flex flex-col min-w-0 gap-2 sm:gap-3">

        {/* TopBar lives on the amber background */}
        <TopBar user={user} isGuest={isGuest} onMenuToggle={() => setDrawerOpen(v => !v)} hideMobileAvatar={drawerOpen} />

        {/*
         * Main content card — white, rounded, takes all remaining height.
         * Only THIS scrolls; the amber shell stays fixed.
         */}
        <div
          className="flex-1 rounded-2xl sm:rounded-3xl overflow-hidden min-h-0"
          style={{
            background: '#FFFFFF',
            boxShadow: '0 8px 40px rgba(180, 130, 50, 0.15)',
          }}
        >
          <div className="h-full overflow-y-auto px-4 py-4 sm:px-8 sm:py-8 pb-4 sm:pb-8">
            <div className="max-w-[1400px] mx-auto">
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile drawer (hamburger menu) ── */}
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} isGuest={isGuest} unreadCount={unreadCount} />
    </div>
  )
}