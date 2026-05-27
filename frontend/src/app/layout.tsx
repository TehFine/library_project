import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { ToastProvider } from '@/hooks/useToast'

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'Thư viện', template: '%s — Thư viện' },
  description: 'Hệ thống quản lý mượn sách thư viện',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={inter.variable}>
      <body>
        <ToastProvider>
          <Toaster position="bottom-right" toastOptions={{ duration: 3500 }} />
          {children}
          {/* Custom toast system is also available via useToast() */}
        </ToastProvider>
      </body>
    </html>
  )
}