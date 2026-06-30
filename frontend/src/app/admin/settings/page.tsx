'use client'
import { useState, useCallback, useEffect } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Card, Badge } from '@/components/ui'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { adminApi, SystemTask } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Mail, AlertTriangle, CheckCircle, Settings2, BookOpen, Play, RefreshCw } from 'lucide-react'

type Tab = 'rules' | 'email' | 'tasks'

interface RuleSettings {
  maxBooksPerBorrow: number
  maxBorrowDays: number
  maxRenewals: number
  renewalDays: number
  fineFirst5Days: number
  fineFromDay6: number
  newCardFee: number
  defaultCardDuration: string
  autoDeactivateMonths: number
  autoLockDays: number
}

interface EmailSettings {
  smtpHost: string
  smtpPort: number
  smtpSecurity: string
  smtpUsername: string
  smtpPassword: string
  displayName: string
  senderEmail: string
}

interface RuleErrors {
  [key: string]: string | undefined
}

const toast = (message: string, type: 'success' | 'error') => {
  const el = document.createElement('div')
  el.className = `fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl text-sm font-bold shadow-xl transition-all duration-300 ${
    type === 'success'
      ? 'bg-emerald-600 text-white'
      : 'bg-red-600 text-white'
  }`
  el.textContent = message
  document.body.appendChild(el)
  setTimeout(() => {
    el.style.opacity = '0'
    el.style.transform = 'translateX(100px)'
    setTimeout(() => el.remove(), 300)
  }, 3000)
}

// ── Validation helpers ────────────────────────────────────────────────
function validateRuleSettings(s: RuleSettings): RuleErrors {
  const e: RuleErrors = {}

  if (!Number.isInteger(s.maxBooksPerBorrow) || s.maxBooksPerBorrow < 1) e.maxBooksPerBorrow = 'Tối thiểu 1'
  if (s.maxBooksPerBorrow > 20) e.maxBooksPerBorrow = 'Tối đa 20 cuốn/lần'

  if (!Number.isInteger(s.maxBorrowDays) || s.maxBorrowDays < 1) e.maxBorrowDays = 'Tối thiểu 1 ngày'
  if (s.maxBorrowDays > 365) e.maxBorrowDays = 'Tối đa 365 ngày'

  if (!Number.isInteger(s.maxRenewals) || s.maxRenewals < 0) e.maxRenewals = 'Không được âm'
  if (s.maxRenewals > 10) e.maxRenewals = 'Tối đa 10 lần'

  if (!Number.isInteger(s.renewalDays) || s.renewalDays < 1) e.renewalDays = 'Tối thiểu 1 ngày'
  if (s.renewalDays > 90) e.renewalDays = 'Tối đa 90 ngày'

  if (!Number.isFinite(s.fineFirst5Days) || s.fineFirst5Days < 0) e.fineFirst5Days = 'Không được âm'
  if (s.fineFirst5Days > 100000) e.fineFirst5Days = 'Tối đa 100,000đ/ngày'

  if (!Number.isFinite(s.fineFromDay6) || s.fineFromDay6 < 0) e.fineFromDay6 = 'Không được âm'
  if (s.fineFromDay6 > 100000) e.fineFromDay6 = 'Tối đa 100,000đ/ngày'

  if (!Number.isFinite(s.newCardFee) || s.newCardFee < 0) e.newCardFee = 'Không được âm'
  if (s.newCardFee > 1000000) e.newCardFee = 'Tối đa 1,000,000đ'

  if (!Number.isInteger(s.autoDeactivateMonths) || s.autoDeactivateMonths < 1) e.autoDeactivateMonths = 'Tối thiểu 1 tháng'
  if (s.autoDeactivateMonths > 12) e.autoDeactivateMonths = 'Tối đa 12 tháng'

  if (!Number.isInteger(s.autoLockDays) || s.autoLockDays < 1) e.autoLockDays = 'Tối thiểu 1 ngày'
  if (s.autoLockDays > 365) e.autoLockDays = 'Tối đa 365 ngày'

  return e
}

// ── Filter non-numeric keys (chặn nhập chữ vào ô số) ──────────────────
function preventNonNumeric(e: React.KeyboardEvent<HTMLInputElement>) {
  const allowed = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']
  if (allowed.includes(e.key)) return

  if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) return

  if (!/^[0-9]$/.test(e.key)) {
    e.preventDefault()
  }
}

export default function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('rules')
  const [saving, setSaving] = useState(false)
  const [saveResult, setSaveResult] = useState<{ ok: boolean; message: string } | null>(null)

  // ── Loading state ───────────────────────────────────────────────────
  const [loadingSettings, setLoadingSettings] = useState(true)

  // ── Rule settings state ─────────────────────────────────────────────
  const defaultRules: RuleSettings = {
    maxBooksPerBorrow: 3,
    maxBorrowDays: 14,
    maxRenewals: 2,
    renewalDays: 14,
    fineFirst5Days: 1000,
    fineFromDay6: 3000,
    newCardFee: 5000,
    defaultCardDuration: '1y',
    autoDeactivateMonths: 3,
    autoLockDays: 30,
  }
  const [rules, setRules] = useState<RuleSettings>(defaultRules)
  const [ruleErrors, setRuleErrors] = useState<RuleErrors>({})

  // ── Email settings state ────────────────────────────────────────────
  const [email, setEmail] = useState<EmailSettings>({
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpSecurity: 'tls',
    smtpUsername: 'library@gmail.com',
    smtpPassword: '••••••••••••',
    displayName: 'Thư Viện Bookly',
    senderEmail: 'no-reply@library.vn',
  })

  // ── Tasks state ─────────────────────────────────────────────────────
  const [tasks, setTasks] = useState<SystemTask[]>([])
  const [tasksLoading, setTasksLoading] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [runningId, setRunningId] = useState<string | null>(null)
  const [taskLog, setTaskLog] = useState<string>('')

  // ── Cập nhật rules với validation inline ────────────────────────────
  const updateRule = useCallback(<K extends keyof RuleSettings>(
    key: K,
    rawValue: string,
  ) => {
    const num = rawValue === '' ? 0 : Number(rawValue)
    setRules(prev => ({ ...prev, [key]: num }))
    setRuleErrors(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [])

  // ── Load settings from API ─────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoadingSettings(true)
      try {
        const [apiData, systemTasks] = await Promise.all([
          adminApi.getSettings(),
          adminApi.getSystemTasks(),
        ])
        if (cancelled) return
        setRules({
          maxBooksPerBorrow: Number(apiData.max_books_per_borrow ?? 3),
          maxBorrowDays: Number(apiData.max_borrow_days ?? 14),
          maxRenewals: Number(apiData.max_renewals ?? 2),
          renewalDays: Number(apiData.renewal_days ?? 14),
          fineFirst5Days: Number(apiData.fine_first_5_days ?? 1000),
          fineFromDay6: Number(apiData.fine_from_day_6 ?? 3000),
          newCardFee: Number(apiData.new_card_fee ?? 5000),
          defaultCardDuration: apiData.default_card_duration ?? '1y',
          autoDeactivateMonths: Number(apiData.auto_deactivate_months ?? 3),
          autoLockDays: Number(apiData.auto_lock_days ?? 30),
        })
        setTasks(systemTasks)
        setTaskLog(`Lần kiểm tra gần nhất: ${new Date().toLocaleString('vi-VN')}`)
      } catch (err) {
        // Fallback to defaults
        setRules(defaultRules)
      } finally {
        if (!cancelled) setLoadingSettings(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // ── Lưu thay đổi ────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setSaving(true)
    setSaveResult(null)

    const errors = validateRuleSettings(rules)
    setRuleErrors(errors)

    if (Object.keys(errors).length > 0) {
      setSaveResult({ ok: false, message: 'Vui lòng sửa các lỗi trước khi lưu' })
      setSaving(false)
      return
    }

    try {
      // Map frontend keys to backend keys
      await adminApi.updateSettings({
        max_books_per_borrow: String(rules.maxBooksPerBorrow),
        max_borrow_days: String(rules.maxBorrowDays),
        max_renewals: String(rules.maxRenewals),
        renewal_days: String(rules.renewalDays),
        fine_first_5_days: String(rules.fineFirst5Days),
        fine_from_day_6: String(rules.fineFromDay6),
        new_card_fee: String(rules.newCardFee),
        default_card_duration: rules.defaultCardDuration,
        auto_deactivate_months: String(rules.autoDeactivateMonths),
        auto_lock_days: String(rules.autoLockDays),
      })
      setSaveResult({ ok: true, message: 'Đã lưu cấu hình thành công' })
      toast('Đã lưu cấu hình thành công', 'success')
    } catch (err: any) {
      setSaveResult({ ok: false, message: err?.message || 'Lỗi khi lưu cấu hình' })
      toast(err?.message || 'Lỗi khi lưu cấu hình', 'error')
    } finally {
      setSaving(false)
    }
  }, [rules])

  // ── Helper: Input số với validation tích hợp ────────────────────────
  function NumberField({
    label,
    value,
    unit,
    min,
    max,
    step = 1,
    onChange,
    error,
    className = 'w-24 text-center',
  }: {
    label: string
    value: number
    unit?: string
    min?: number
    max?: number
    step?: number
    onChange: (val: string) => void
    error?: string
    className?: string
  }) {
    return (
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-600">{label}</label>
        <div className={unit ? 'flex items-center gap-2' : ''}>
          <div className={className}>
            <Input
              type="number"
              value={value}
              onChange={e => onChange(e.target.value)}
              onKeyDown={preventNonNumeric}
              min={min}
              max={max}
              step={step}
              inputMode="numeric"
              className="text-center"
              error={error}
            />
          </div>
          {unit && (
            <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap shrink-0">
              {unit}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <PageHeader 
          title="Cấu hình hệ thống" 
          description="Thiết lập các quy định nghiệp vụ và thông số kỹ thuật."
        />
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {saveResult && (
            <div className={cn(
              'flex items-center gap-2 text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-lg order-last sm:order-none',
              saveResult.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700',
            )}>
              {saveResult.ok
                ? <CheckCircle className="w-3.5 h-3.5" />
                : <AlertTriangle className="w-3.5 h-3.5" />
              }
              {saveResult.message}
            </div>
          )}
          <Button
            variant="primary"
            className="w-full sm:w-auto px-6 sm:px-8 shadow-glow shadow-amber-500/30 justify-center"
            onClick={handleSave}
            loading={saving}
          >
            Lưu thay đổi
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl overflow-x-auto scrollbar-hide max-w-full w-fit">
        {([
          { id: 'rules', label: 'Quy định mượn trả', icon: BookOpen },
          { id: 'email', label: 'Cấu hình Email', icon: Mail },
          { id: 'tasks', label: 'Tác vụ tự động', icon: Settings2 },
        ] as const).map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id as Tab); setSaveResult(null) }}
              className={cn(
                'flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0',
                activeTab === t.id ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <Icon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeTab === 'rules' && (
          <div className="space-y-6">
            <Card padding="lg" className="p-4 sm:p-6">
               <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3 mb-4 sm:mb-6">QUY ĐỊNH MƯỢN SÁCH</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <NumberField
                    label="Số sách tối đa / lần mượn"
                    value={rules.maxBooksPerBorrow}
                    unit="cuốn"
                    min={1}
                    max={20}
                    onChange={v => updateRule('maxBooksPerBorrow', v)}
                    error={ruleErrors.maxBooksPerBorrow}
                  />
                  <NumberField
                    label="Số ngày mượn tối đa"
                    value={rules.maxBorrowDays}
                    unit="ngày"
                    min={1}
                    max={365}
                    onChange={v => updateRule('maxBorrowDays', v)}
                    error={ruleErrors.maxBorrowDays}
                  />
                  <NumberField
                    label="Số lần gia hạn tối đa"
                    value={rules.maxRenewals}
                    unit="lần"
                    min={0}
                    max={10}
                    onChange={v => updateRule('maxRenewals', v)}
                    error={ruleErrors.maxRenewals}
                  />
                  <NumberField
                    label="Số ngày gia hạn thêm"
                    value={rules.renewalDays}
                    unit="ngày"
                    min={1}
                    max={90}
                    onChange={v => updateRule('renewalDays', v)}
                    error={ruleErrors.renewalDays}
                  />
               </div>
            </Card>

            <Card padding="lg" className="p-4 sm:p-6">
               <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3 mb-4 sm:mb-6">QUY ĐỊNH PHÍ PHẠT</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <NumberField
                    label="Phí phạt ngày 1 – 5"
                    value={rules.fineFirst5Days}
                    unit="đ / ngày"
                    min={0}
                    max={100000}
                    step={500}
                    onChange={v => updateRule('fineFirst5Days', v)}
                    error={ruleErrors.fineFirst5Days}
                    className="w-32"
                  />
                  <NumberField
                    label="Phí phạt từ ngày 6 trở đi"
                    value={rules.fineFromDay6}
                    unit="đ / ngày"
                    min={0}
                    max={100000}
                    step={500}
                    onChange={v => updateRule('fineFromDay6', v)}
                    error={ruleErrors.fineFromDay6}
                    className="w-32"
                  />
               </div>
            </Card>

            <Card padding="lg" className="p-4 sm:p-6">
               <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3 mb-4 sm:mb-6">QUY ĐỊNH THẺ ĐỘC GIẢ</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  <div className="space-y-4">
                    <NumberField
                      label="Lệ phí làm thẻ mới"
                      value={rules.newCardFee}
                      unit="đ"
                      min={0}
                      max={1000000}
                      step={1000}
                      onChange={v => updateRule('newCardFee', v)}
                      error={ruleErrors.newCardFee}
                      className="w-32"
                    />
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-600">Thời hạn mặc định</label>
                      <div className="w-32">
                        <Select
                          value={rules.defaultCardDuration}
                          onChange={e => setRules(prev => ({ ...prev, defaultCardDuration: e.target.value }))}
                        >
                          <option value="6m">6 tháng</option>
                          <option value="1y">1 năm</option>
                          <option value="2y">2 năm</option>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <NumberField
                      label="Tự động hủy thẻ hết hạn sau"
                      value={rules.autoDeactivateMonths}
                      unit="tháng"
                      min={1}
                      max={12}
                      onChange={v => updateRule('autoDeactivateMonths', v)}
                      error={ruleErrors.autoDeactivateMonths}
                    />
                    <NumberField
                      label="Tự động khóa thẻ khi quá hạn"
                      value={rules.autoLockDays}
                      unit="ngày"
                      min={1}
                      max={365}
                      onChange={v => updateRule('autoLockDays', v)}
                      error={ruleErrors.autoLockDays}
                    />
                  </div>
               </div>
            </Card>
          </div>
        )}

        {activeTab === 'email' && (            <Card padding="lg" className="space-y-5 sm:space-y-6 p-4 sm:p-6">
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">CẤU HÌNH SMTP EMAIL</h3>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                   <Button variant="ghost" className="text-[10px] sm:text-xs font-bold text-amber-600 w-full sm:w-auto">Kiểm tra kết nối</Button>
                </div>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="col-span-1 sm:col-span-2">
                   <Input
                     label="SMTP Host"
                     value={email.smtpHost}
                     onChange={e => setEmail(prev => ({ ...prev, smtpHost: e.target.value }))}
                   />
                </div>
                <Input
                  label="SMTP Port"
                  type="number"
                  value={email.smtpPort}
                  min={1}
                  max={65535}
                  onChange={e => setEmail(prev => ({ ...prev, smtpPort: Number(e.target.value) }))}
                  onKeyDown={preventNonNumeric}
                />
                <Select
                  label="SSL/TLS"
                  value={email.smtpSecurity}
                  onChange={e => setEmail(prev => ({ ...prev, smtpSecurity: e.target.value }))}
                >
                  <option value="tls">STARTTLS</option>
                  <option value="ssl">SSL/TLS</option>
                </Select>
                <Input
                  label="Username"
                  value={email.smtpUsername}
                  onChange={e => setEmail(prev => ({ ...prev, smtpUsername: e.target.value }))}
                />
                <Input
                  label="Password"
                  type="password"
                  value={email.smtpPassword}
                  onChange={e => setEmail(prev => ({ ...prev, smtpPassword: e.target.value }))}
                />
                <Input
                  label="Tên hiển thị"
                  value={email.displayName}
                  onChange={e => setEmail(prev => ({ ...prev, displayName: e.target.value }))}
                />
                <Input
                  label="Email gửi đi"
                  type="email"
                  value={email.senderEmail}
                  onChange={e => setEmail(prev => ({ ...prev, senderEmail: e.target.value }))}
                />
             </div>
             <div className="p-3 sm:p-4 rounded-2xl bg-amber-50 border border-amber-100 flex gap-3 sm:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-600 flex items-center justify-center text-white shrink-0 shadow-lg"><Mail className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                <p className="text-[11px] sm:text-xs text-amber-800 leading-relaxed">
                  Cấu hình này được dùng để gửi thông báo quá hạn, đặt trước, gia hạn thẻ và cấp lại mật khẩu cho nhân viên/độc giả. Đảm bảo thông tin SMTP là chính xác để không bị gián đoạn dịch vụ.
                </p>
             </div>
          </Card>
        )}

        {activeTab === 'tasks' && (
          <Card padding="none" className="overflow-hidden border-none shadow-card">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
               <div className="flex items-center gap-2">
                 <Settings2 className="w-4 h-4 text-amber-500" />
                 <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">LỊCH TÁC VỤ TỰ ĐỘNG</h3>
               </div>
               <Badge className={"bg-emerald-50 text-emerald-700 text-[10px] sm:text-xs"}>
                 {tasks.filter(t => t.enabled).length}/{tasks.length} đang hoạt động
               </Badge>
            </div>
            {tasksLoading ? (
              <div className="p-10 text-center">
                <div className="w-10 h-10 mx-auto rounded-2xl bg-gray-100 animate-pulse mb-3" />
                <p className="text-gray-400 text-sm">Đang tải...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="p-10 text-center">
                <Settings2 className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-400 text-sm font-medium">Không có tác vụ nào</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[500px]"><thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 sm:py-4">Tác vụ</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4">Lịch chạy</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-center">Trạng thái</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm">
                    {tasks.map(task => (
                      <tr key={task.id} className="hover:bg-slate-50/50">
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <p className="font-bold text-slate-800 text-[12px] sm:text-sm">{task.name}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{task.description}</p>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-500 font-medium italic text-[12px] sm:text-sm">{task.schedule}</td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-center">
                           <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={task.enabled}
                                disabled={togglingId === task.id}
                                onChange={async () => {
                                  setTogglingId(task.id)
                                  try {
                                    const newState = !task.enabled
                                    await adminApi.toggleSystemTask(task.id, newState)
                                    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, enabled: newState } : t))
                                    toast(newState ? `Đã bật tác vụ: ${task.name}` : `Đã tắt tác vụ: ${task.name}`, 'success')
                                  } catch (err: any) {
                                    toast(err?.message || 'Lỗi khi thay đổi trạng thái', 'error')
                                  } finally {
                                    setTogglingId(null)
                                  }
                                }}
                              />
                              <div className={`w-11 h-6 rounded-full peer-focus:outline-none after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${task.enabled ? 'bg-amber-600 after:translate-x-full after:border-white' : 'bg-slate-200 after:border-gray-300'}`}></div>
                           </label>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                           <button
                             onClick={async () => {
                               setRunningId(task.id)
                               try {
                                 const result = await adminApi.runSystemTask(task.id)
                                 toast(result.message, 'success')
                                 setTaskLog(`Lần chạy gần nhất: ${new Date().toLocaleString('vi-VN')} - ${result.message}`)
                               } catch (err: any) {
                                 toast(err?.message || 'Lỗi khi chạy tác vụ', 'error')
                               } finally {
                                 setRunningId(null)
                               }
                             }}
                             disabled={runningId === task.id}
                             className="text-[11px] sm:text-xs font-bold text-amber-600 hover:bg-amber-50 px-2.5 sm:px-3 py-1.5 rounded-lg border border-amber-100 transition-all whitespace-nowrap disabled:opacity-50"
                           >
                              {runningId === task.id ? (
                                <span className="inline-flex items-center gap-1">
                                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                  Đang chạy
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1">
                                  <Play className="w-3.5 h-3.5" /> Chạy ngay
                                </span>
                              )}
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="p-3 sm:p-4 bg-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">
               {taskLog || `Đang tải...`}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
