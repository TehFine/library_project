'use client'
import { useEffect, useState, ReactNode } from 'react'
import { Book, BookOpen, Library, Search, Smartphone } from 'lucide-react'

function FadeIn({ show, children }: { show: boolean; children: ReactNode }) {
  return (
    <div
      className="transition-all duration-500 ease-out"
      style={{
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0)' : 'translateY(20px)',
      }}
    >
      {children}
    </div>
  )
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  return (
    <div className="min-h-screen flex">
      {/* ── Left Side: Illustration ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#2C1810] via-[#4A2F1A] to-[#6B4226] items-center justify-center">
        {/* Decorative orbs */}
        <div className="absolute top-0 -left-20 w-[400px] h-[400px] rounded-full opacity-20"
             style={{ background: 'radial-gradient(circle, #E8941A 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 -right-20 w-[500px] h-[500px] rounded-full opacity-15"
             style={{ background: 'radial-gradient(circle, #F5B642 0%, transparent 70%)' }} />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full opacity-10"
             style={{ background: 'radial-gradient(circle, #E8941A 0%, transparent 70%)' }} />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-12 max-w-lg">
          {/* Large decorative book icon */}
          <div className="relative mb-10">
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 backdrop-blur-sm flex items-center justify-center shadow-2xl">
              <BookOpen className="w-16 h-16 text-primary-light" />
            </div>
            {/* Floating small books */}
            <div className="absolute -top-3 -right-3 w-12 h-16 rounded-lg bg-primary/20 border border-primary/30 rotate-12 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <Book className="w-6 h-6 text-primary-light" />
            </div>
            <div className="absolute -bottom-2 -left-4 w-10 h-14 rounded-lg bg-amber-700/30 border border-amber-600/40 -rotate-6 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <Book className="w-5 h-5 text-amber-300" />
            </div>
            {/* Sparkles */}
            <div className="absolute top-1/2 -left-8 w-2 h-2 rounded-full bg-primary animate-pulse" />
            <div className="absolute top-0 left-1/2 w-1.5 h-1.5 rounded-full bg-amber-300/70 animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>

          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            Bookly
          </h1>
          <p className="text-base text-amber-200/80 leading-relaxed">
            Hệ thống quản lý thư viện thông minh — nơi tri thức được kết nối và lan tỏa
          </p>

          {/* Features list */}
          <div className="mt-10 grid grid-cols-1 gap-3 w-full max-w-xs">
            {[
              { icon: Library, text: 'Quản lý sách thông minh' },
              { icon: Search, text: 'Tra cứu nhanh chóng' },
              { icon: Smartphone, text: 'Đặt mượn trực tuyến' },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-amber-100/90 text-sm"
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{item.text}</span>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <p className="mt-10 text-xs text-amber-300/40">
            Thư viện số · Kết nối tri thức
          </p>
        </div>
      </div>

      {/* ── Right Side: Form ── */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 bg-gradient-to-br from-[#FFF8F0] via-white to-[#FFF3E0] relative overflow-y-auto">
        {/* Left accent line */}
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary/30 via-primary/10 to-transparent hidden lg:block" />

        {/* Mobile header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-gradient-to-r from-[#2C1810] via-[#4A2F1A] to-[#6B4226] px-6 py-4 flex items-center gap-3 shadow-lg">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shrink-0">
            <Book className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg">Bookly</span>
        </div>

        <div className="relative w-full max-w-md py-8 lg:py-0 mt-20 lg:mt-0">
          <FadeIn show={mounted}>
            {children}
          </FadeIn>
        </div>
      </div>
    </div>
  )
}
