'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authApi } from '@/lib/api'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await authApi.login(email, password)
      localStorage.setItem('access_token', res.accessToken)
      document.cookie = `access_token=${res.accessToken}; path=/; max-age=86400; SameSite=Lax`
      router.push('/reader/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sai email hoặc mật khẩu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-3xl bg-white/80 backdrop-blur-xl shadow-[0_20px_60px_rgba(180,130,50,0.2)] border border-amber-100/60 p-8">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-dark items-center justify-center shadow-glow mb-3">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-800">Bookly</h1>
        <p className="mt-1 text-sm text-gray-500">Đăng nhập để tiếp tục</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          autoComplete="email"
        />
        <Input
          label="Mật khẩu"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        )}

        <Button type="submit" loading={loading} fullWidth size="lg" className="mt-2">
          Đăng nhập
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Chưa có tài khoản?{' '}
        <Link href="/auth/register" className="text-primary font-bold hover:underline">
          Đăng ký ngay
        </Link>
      </p>
    </div>
  )
}