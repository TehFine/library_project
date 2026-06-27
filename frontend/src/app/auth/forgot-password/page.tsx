'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, KeyRound, Send, Undo2, AlertTriangle, Clock } from 'lucide-react'
import { authApi } from '@/lib/api'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) {
      setError('Vui lòng nhập email')
      return
    }
    setLoading(true)
    setError('')
    try {
      await authApi.forgotPassword(email)
      setSent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gửi yêu cầu thất bại')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-5">
          <Mail className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-xl font-bold text-gray-800 flex items-center justify-center gap-2">Email đã được gửi! <Send className="w-6 h-6 text-primary" /></h1>
        <p className="mt-3 text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
          Nếu email <span className="font-medium text-gray-700">{email}</span> tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.
        </p>
        <div className="mt-6 p-4 rounded-2xl bg-amber-50/60 border border-amber-100/60 text-left">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Hướng dẫn</p>
          <div className="space-y-1.5 text-xs text-gray-400">
            <p><Mail className="w-3.5 h-3.5 inline" /> Kiểm tra <span className="text-gray-600 font-medium">hộp thư đến</span> (và thư mục Spam/Junk)</p>
            <p><Clock className="w-3.5 h-3.5 inline" /> Link đặt lại mật khẩu có hiệu lực trong <span className="text-gray-600 font-medium">30 phút</span></p>
            <p><KeyRound className="w-3.5 h-3.5 inline" /> Nhấn vào link trong email để tạo mật khẩu mới</p>
          </div>
        </div>
        <Button
          className="mt-8 shadow-lg shadow-primary/25"
          fullWidth
          size="lg"
          onClick={() => router.push('/auth/login')}
        >
          <Undo2 className="w-5 h-5" />
          Quay lại đăng nhập
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
        <h1 className="text-xl font-bold text-gray-900">Quên mật khẩu?</h1>
        <p className="mt-1.5 text-sm text-gray-500">
          Nhập email của bạn, chúng tôi sẽ hướng dẫn bạn cách đặt lại mật khẩu.
        </p>
      </div>

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

        {error && (
          <div className="flex items-center gap-2.5 text-sm text-red-600 bg-red-50/80 border border-red-100 rounded-2xl px-4 py-3 animate-slide-up">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <Button type="submit" loading={loading} fullWidth size="lg" className="shadow-lg shadow-primary/25">
          <Send className="w-5 h-5" />
          Gửi yêu cầu
        </Button>
      </form>

      <div className="mt-8 text-center">
        <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-all">
          <Undo2 className="w-4 h-4" />
          Quay lại đăng nhập
        </Link>
      </div>
    </div>
  )
}
