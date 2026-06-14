'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Lock, KeyRound, CheckCircle, AlertTriangle, Undo2, PartyPopper } from 'lucide-react'
import { authApi } from '@/lib/api'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const token = searchParams.get('token') || ''
  const email = searchParams.get('email') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const invalidLink = !token || !email

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự.')
      return
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }

    setLoading(true)
    setError('')
    try {
      await authApi.resetPassword({ token, email, password })
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Đặt lại mật khẩu thất bại')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-800 flex items-center justify-center gap-2">Đặt lại mật khẩu thành công! <PartyPopper className="w-6 h-6 text-amber-500" /></h1>
        <p className="mt-3 text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
          Mật khẩu của bạn đã được cập nhật. Vui lòng đăng nhập với mật khẩu mới.
        </p>
        <Button
          className="mt-8 shadow-lg shadow-primary/25"
          fullWidth
          size="lg"
          onClick={() => router.push('/auth/login')}
        >
          <Undo2 className="w-5 h-5" />
          Đăng nhập ngay
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center mx-auto mb-4">
          <KeyRound className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Đặt lại mật khẩu</h1>
        <p className="mt-1.5 text-sm text-gray-500">
          {email ? (
            <>Nhập mật khẩu mới cho <span className="font-medium text-gray-700">{email}</span></>
          ) : (
            'Vui lòng nhập mật khẩu mới của bạn.'
          )}
        </p>
      </div>

      {invalidLink ? (
        <div className="text-center py-6">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-gray-700 font-medium">Link không hợp lệ</p>
          <p className="mt-1.5 text-sm text-gray-500">
            Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới.
          </p>
          <Link
            href="/auth/forgot-password"
            className="inline-flex items-center gap-1.5 mt-6 text-sm text-primary font-medium hover:text-primary-dark hover:underline transition-all"
          >
            <Undo2 className="w-4 h-4" />
            Yêu cầu đặt lại mật khẩu
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Mật khẩu mới"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            hint="Tối thiểu 8 ký tự"
            leftIcon={<Lock className="w-4 h-4" />}
          />
          <Input
            label="Xác nhận mật khẩu mới"
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
            leftIcon={<Lock className="w-4 h-4" />}
          />

          {error && (
            <div className="flex items-center gap-2.5 text-sm text-red-600 bg-red-50/80 border border-red-100 rounded-2xl px-4 py-3 animate-slide-up">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <Button type="submit" loading={loading} fullWidth size="lg" className="shadow-lg shadow-primary/25">
            <CheckCircle className="w-5 h-5" />
            Đặt lại mật khẩu
          </Button>
        </form>
      )}

      <div className="mt-8 text-center">
        <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-all">
          <Undo2 className="w-4 h-4" />
          Quay lại đăng nhập
        </Link>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="text-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        <p className="mt-4 text-sm text-gray-500">Đang tải...</p>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
