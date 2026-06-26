'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, LogIn, AlertTriangle } from 'lucide-react'
import { authApi } from '@/lib/api'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { getDashboardPath } from '@/lib/auth-utils'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  // Lấy lý do khóa tài khoản từ URL params (redirect từ force-logout)
  const lockedReason = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('message')
    : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await authApi.login(email, password)
      localStorage.setItem('access_token', res.accessToken)
      document.cookie = `access_token=${res.accessToken}; path=/; max-age=86400; SameSite=Lax`
      router.push(getDashboardPath(res.user.role))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sai email hoặc mật khẩu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Đăng nhập</h1>
        <p className="mt-1.5 text-sm text-gray-500">
          Chào mừng trở lại! Vui lòng đăng nhập để tiếp tục.
        </p>
      </div>

      {/* Locked account banner */}
      {lockedReason && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 shadow-sm">
          <div className="flex gap-3 items-start">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-red-800">Tài khoản đã bị khóa</p>
              <p className="text-xs text-red-600 mt-1 leading-relaxed">
                {lockedReason}
              </p>
              <p className="text-xs text-red-500 mt-2 font-medium">
                Vui lòng liên hệ thủ thư hoặc quản trị viên để được hỗ trợ.
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          autoComplete="email"
          leftIcon={<Mail className="w-4 h-4" />}
        />
        <div>
          <Input
            label="Mật khẩu"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            leftIcon={<Lock className="w-4 h-4" />}
          />
          <div className="flex justify-end mt-1.5">
            <Link
              href="/auth/forgot-password"
              className="text-xs text-primary hover:text-primary-dark font-medium hover:underline transition-all"
            >
              Quên mật khẩu?
            </Link>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 text-sm text-red-600 bg-red-50/80 border border-red-100 rounded-2xl px-4 py-3 animate-slide-up">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <Button type="submit" loading={loading} fullWidth size="lg" className="mt-2 shadow-lg shadow-primary/25">
          <LogIn className="w-5 h-5" />
          Đăng nhập
        </Button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          Chưa có tài khoản?{' '}
          <Link href="/auth/register" className="text-primary font-semibold hover:text-primary-dark hover:underline transition-all">
            Đăng ký ngay
          </Link>
        </p>
      </div>

      {/* Demo accounts hint */}
      <div className="mt-6 p-4 rounded-2xl bg-amber-50/60 border border-amber-100/60">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tài khoản dùng thử</p>
        <div className="space-y-1.5 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary/60" />
            <span><strong className="text-gray-500">Admin:</strong> admin@library.vn / password123</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary/60" />
            <span><strong className="text-gray-500">Thủ thư:</strong> librarian@library.vn / password123</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary/60" />
            <span><strong className="text-gray-500">Độc giả:</strong> reader@example.com / password123</span>
          </div>
        </div>
      </div>
    </div>
  )
}
