'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authApi } from '@/lib/api'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

interface FormData {
  fullName: string
  email: string
  username: string
  password: string
  confirmPassword: string
  phone: string
  address: string
  dateOfBirth: string
}

const INITIAL: FormData = {
  fullName: '', email: '', username: '', password: '',
  confirmPassword: '', phone: '', address: '', dateOfBirth: '',
}

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm]       = useState<FormData>(INITIAL)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)
  const [step, setStep]       = useState<1 | 2>(1)

  function set(field: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  function validateStep1(): string {
    if (!form.fullName.trim()) return 'Vui lòng nhập họ tên'
    if (!form.email.trim())    return 'Vui lòng nhập email'
    if (!form.username.trim()) return 'Vui lòng nhập tên đăng nhập'
    if (form.password.length < 8)                  return 'Mật khẩu ít nhất 8 ký tự'
    if (form.password !== form.confirmPassword)    return 'Mật khẩu xác nhận không khớp'
    return ''
  }

  function handleNext(e: React.FormEvent) {
    e.preventDefault()
    const err = validateStep1()
    if (err) { setError(err); return }
    setError('')
    setStep(2)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.dateOfBirth) { setError('Vui lòng nhập ngày sinh'); return }
    setLoading(true)
    setError('')
    try {
      await authApi.register({
        email: form.email, password: form.password, username: form.username,
        fullName: form.fullName, phone: form.phone, address: form.address,
        dateOfBirth: form.dateOfBirth,
      })
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Đăng ký thất bại')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-3xl bg-white/80 backdrop-blur-xl shadow-[0_20px_60px_rgba(180,130,50,0.2)] border border-amber-100/60 p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-lg font-bold text-gray-800">Đăng ký thành công!</h1>
        <p className="mt-2 text-sm text-gray-500">
          Tài khoản đã được tạo. Vui lòng đến thư viện với CCCD để nhận thẻ mượn sách.
        </p>
        <Button className="mt-6" fullWidth onClick={() => router.push('/auth/login')}>
          Đăng nhập ngay
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-3xl bg-white/80 backdrop-blur-xl shadow-[0_20px_60px_rgba(180,130,50,0.2)] border border-amber-100/60 p-8">
      {/* Logo */}
      <div className="text-center mb-6">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary-dark items-center justify-center shadow-glow mb-3">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-800">Tạo tài khoản</h1>
        <p className="mt-1 text-sm text-gray-500">Tham gia thư viện Bookly</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-6">
        {[1, 2].map(s => (
          <div key={s} className="flex items-center gap-3 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300 ${
              step >= s
                ? 'bg-gradient-to-br from-primary to-primary-dark text-white shadow-glow'
                : 'bg-amber-100 text-amber-400'
            }`}>{s}</div>
            {s < 2 && (
              <div className={`h-0.5 flex-1 rounded-full transition-all duration-500 ${step > s ? 'bg-primary' : 'bg-amber-100'}`} />
            )}
          </div>
        ))}
      </div>

      {step === 1 ? (
        <form onSubmit={handleNext} className="space-y-4">
          <Input label="Họ và tên" value={form.fullName} onChange={set('fullName')} placeholder="Nguyễn Văn A" required />
          <Input label="Email" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
          <Input label="Tên đăng nhập" value={form.username} onChange={set('username')} placeholder="nguyenvana" required />
          <Input label="Mật khẩu" type="password" value={form.password} onChange={set('password')} placeholder="••••••••" required hint="Tối thiểu 8 ký tự" />
          <Input label="Xác nhận mật khẩu" type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="••••••••" required />

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              {error}
            </div>
          )}
          <Button type="submit" fullWidth size="lg">Tiếp theo →</Button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Số điện thoại" type="tel" value={form.phone} onChange={set('phone')} placeholder="0901234567" />
          <Input label="Ngày sinh" type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} required hint="Phải từ 18 tuổi trở lên" />
          <Input label="Địa chỉ" value={form.address} onChange={set('address')} placeholder="123 Đường ABC, TP.HCM" />

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => { setStep(1); setError('') }} className="flex-1">← Quay lại</Button>
            <Button type="submit" loading={loading} className="flex-1">Đăng ký</Button>
          </div>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-gray-500">
        Đã có tài khoản?{' '}
        <Link href="/auth/login" className="text-primary font-bold hover:underline">Đăng nhập</Link>
      </p>
    </div>
  )
}