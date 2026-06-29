'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { READER_NAV, LIBRARIAN_NAV, ADMIN_NAV, getNav } from './MobileNav'

interface MobileDrawerProps {
  open: boolean
  onClose: () => void
  isGuest?: boolean
  unreadCount?: number
  pendingRequestsCount?: number
  pendingCardsCount?: number
}

export default function MobileDrawer({ open, onClose, isGuest, unreadCount, pendingRequestsCount, pendingCardsCount }: MobileDrawerProps) {
  const pathname = usePathname()
  let nav = getNav(pathname)

  // Guest mode: chỉ hiển thị mục công khai (sách)
  if (isGuest && pathname.startsWith('/reader')) {
    nav = READER_NAV.filter(i => ['/reader/books'].includes(i.href))
  }

  return (
    <>
      {/* Overlay backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer panel */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-72 bg-[#FDF8F0] shadow-2xl transform transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] md:hidden',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-amber-100/60 shrink-0">
            <Link href="/" className="flex items-center gap-2.5 group" onClick={onClose}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <span className="text-lg font-bold text-gray-800 tracking-tight">Bookly</span>
            </Link>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-amber-50 transition-all"
              aria-label="Đóng menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Nav items */}
          <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-0.5">
            {nav.map(item => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/')
              const isNotif = item.href === '/reader/notifications'
              const isLibrarianRequest = item.href === '/librarian/borrows/requests'
              const isLibrarianCard = item.href === '/librarian/cards'
              const badgeCount = isLibrarianRequest ? pendingRequestsCount : (isLibrarianCard ? pendingCardsCount : (isNotif ? unreadCount : undefined))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3.5 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all duration-200',
                    active
                      ? 'bg-gradient-to-r from-primary to-primary-light text-white shadow-glow'
                      : 'text-gray-600 hover:bg-white/60 hover:text-gray-900',
                  )}
                >
                  <span className={cn('shrink-0 relative', active ? 'text-white' : 'text-gray-400')}>
                    {item.icon(active)}
                    {/* Badge */}
                    {badgeCount !== undefined && badgeCount > 0 && (
                      <span className={cn(
                        'absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] flex items-center justify-center',
                        'rounded-full text-[9px] font-bold leading-none px-0.5',
                        active
                          ? 'bg-white text-primary'
                          : 'bg-red-500 text-white',
                      )}>
                        {badgeCount > 99 ? '99+' : badgeCount}
                      </span>
                    )}
                  </span>
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>
    </>
  )
}
