'use client'
import PageHeader from '@/components/layout/PageHeader'
import { Card, Modal } from '@/components/ui'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { useState, useEffect, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'
import { notificationApi, librarianApi, NotificationTargetCounts, AdminNotification } from '@/lib/api'
import { useRealtimeRefresh } from '@/hooks/useWebSocket'
import {
  Eye, Save, Clock, Rocket, Send, History, X, Search, UserCheck,
  Bell, AlertTriangle, RefreshCw, type LucideIcon,
} from 'lucide-react'
import type { User } from '@/types'

type TargetKey = keyof NotificationTargetCounts

const TARGET_LABELS: Record<TargetKey, string> = {
  all: 'Tất cả độc giả',
  overdue: 'Độc giả có sách quá hạn',
  expiring: 'Độc giả có thẻ sắp hết hạn',
  debt: 'Độc giả còn nợ phí phạt',
}

const TARGET_COLORS: Record<TargetKey, string> = {
  all: 'text-amber-600',
  overdue: 'text-red-600',
  expiring: 'text-amber-600',
  debt: 'text-rose-600',
}

interface UserWithCard extends User {
  cardNumber?: string
}

/* ── Sub-components ─────────────────────────────────────────────────── */

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, j) => (
        <td key={j} className="px-4 sm:px-6 py-4">
          <div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: j === 1 ? '55%' : j === 2 ? '40%' : '35%' }} />
        </td>
      ))}
    </tr>
  )
}

function EmptyState({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description?: string }) {
  return (
    <tr>
      <td colSpan={5} className="py-16 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
            <Icon className="w-7 h-7 text-slate-300" />
          </div>
          <div>
            <p className="text-slate-400 font-medium">{title}</p>
            {description && <p className="text-slate-300 text-xs mt-1">{description}</p>}
          </div>
        </div>
      </td>
    </tr>
  )
}

/* ── Page ────────────────────────────────────────────────────────────── */

export default function BulkNotificationsPage() {
  const [target, setTarget] = useState<TargetKey>('all')
  const [targetCounts, setTargetCounts] = useState<NotificationTargetCounts | null>(null)
  const [history, setHistory] = useState<AdminNotification[]>([])
  const [loadingCounts, setLoadingCounts] = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [historyError, setHistoryError] = useState(false)

  const [template, setTemplate] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState(`Kính gửi {{tên_độc_giả}},\n\nBạn đang có sách quá hạn {{số_ngày}} ngày. Vui lòng hoàn trả sách sớm để tránh phát sinh thêm phí phạt.\n\nTrân trọng,\nBan quản lý thư viện Bookly.`)

  // Custom recipient autocomplete
  const [customList, setCustomList] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserWithCard[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [searching, setSearching] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  const [sending, setSending] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)

  // Tab state
  const [activeTab, setActiveTab] = useState<'compose' | 'history'>('compose')

  const fetchCounts = useCallback(async () => {
    setLoadingCounts(true)
    try {
      const data = await notificationApi.getTargetCounts()
      setTargetCounts(data)
    } catch {
      toast.error('Không thể tải số liệu đối tượng')
    } finally {
      setLoadingCounts(false)
    }
  }, [])

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true)
    setHistoryError(false)
    try {
      const data = await notificationApi.list()
      setHistory(data)
    } catch {
      setHistoryError(true)
      toast.error('Không thể tải lịch sử thông báo')
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  useEffect(() => { fetchCounts() }, [fetchCounts])
  useEffect(() => { fetchHistory() }, [fetchHistory])
  useRealtimeRefresh('admin:notification-update', fetchHistory)

  // Autocomplete search for readers
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }

    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(async () => {
      setSearching(true)
      try {
        const users = await librarianApi.searchUsers(searchQuery.trim())
        setSearchResults(users)
        setShowDropdown(users.length > 0)
      } catch {
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current)
    }
  }, [searchQuery])

  // Click outside to close dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selectRecipient = (user: UserWithCard) => {
    const identifier = user.cardNumber || user.email
    const existing = customList.split(',').map(s => s.trim()).filter(Boolean)
    if (!existing.includes(identifier)) {
      setCustomList(prev => prev ? `${prev}, ${identifier}` : identifier)
    }
    setSearchQuery('')
    setSearchResults([])
    setShowDropdown(false)
  }

  const removeRecipient = (identifier: string) => {
    const list = customList.split(',').map(s => s.trim()).filter(Boolean)
    setCustomList(list.filter(s => s !== identifier).join(', '))
  }

  const recipients = customList.split(',').map(s => s.trim()).filter(Boolean)

  const previewContent = content
    .replace('{{tên_độc_giả}}', 'Trần Văn Minh')
    .replace('{{số_ngày}}', '6')
    .replace('{{tên_sách}}', 'Nhà Giả Kim')
    .replace('{{mã_thẻ}}', 'TV-2024-001')
    .replace('{{số_tiền}}', '20,000')
    .replace('{{ngày_hết_hạn}}', '15/06/2026')

  const handleSend = async () => {
    if (!subject.trim()) { toast.error('Vui lòng nhập tiêu đề thông báo.'); return }
    if (!content.trim()) { toast.error('Vui lòng nhập nội dung thông báo.'); return }
    setSending(true)
    try {
      await notificationApi.create({
        title: subject,
        content,
        targetGroup: target,
        customRecipients: customList || undefined,
        variables: ['{{tên_độc_giả}}', '{{số_ngày}}', '{{tên_sách}}', '{{mã_thẻ}}', '{{số_tiền}}', '{{ngày_hết_hạn}}'].filter(v => content.includes(v)),
        status: 'sent',
      })
      toast.success(`Đã gửi thông báo thành công đến nhóm "${TARGET_LABELS[target]}".`)
      fetchHistory()
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi khi gửi thông báo')
    } finally {
      setSending(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!subject.trim() || !content.trim()) { toast.error('Vui lòng nhập tiêu đề và nội dung trước khi lưu.'); return }
    try {
      await notificationApi.create({
        title: subject,
        content,
        targetGroup: target,
        customRecipients: customList || undefined,
        variables: ['{{tên_độc_giả}}', '{{số_ngày}}', '{{tên_sách}}', '{{mã_thẻ}}', '{{số_tiền}}', '{{ngày_hết_hạn}}'].filter(v => content.includes(v)),
        status: 'draft',
      })
      toast.success('Đã lưu nháp thông báo.')
      fetchHistory()
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi khi lưu nháp')
    }
  }

  const handleSendTest = async () => {
    setSendingTest(true)
    try {
      const notif = await notificationApi.create({
        title: subject || '[Bookly] Thông báo thử nghiệm',
        content,
        targetGroup: target,
        customRecipients: customList || undefined,
        variables: ['{{tên_độc_giả}}', '{{số_ngày}}', '{{tên_sách}}', '{{mã_thẻ}}', '{{số_tiền}}', '{{ngày_hết_hạn}}'].filter(v => content.includes(v)),
        status: 'draft',
      })
      await notificationApi.sendTest(notif.id)
      toast.success('Đã gửi thông báo thử nghiệm đến email của bạn.')
      setShowPreview(false)
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi khi gửi thử')
    } finally {
      setSendingTest(false)
    }
  }

  const handleInsertVariable = (variable: string) => {
    setContent(prev => prev + variable)
  }

  const charCount = content.length

  const targetOptions: { id: TargetKey; label: string; color: string }[] = targetCounts
    ? (['all', 'overdue', 'expiring', 'debt'] as TargetKey[]).map(key => ({
        id: key,
        label: TARGET_LABELS[key],
        color: TARGET_COLORS[key],
      }))
    : []

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <PageHeader
          title="Gửi thông báo hàng loạt"
          description="Gửi thông báo Email đến nhóm độc giả được chỉ định."
        />
        <div className="flex gap-1 bg-slate-100 rounded-2xl p-1 shrink-0 self-start sm:self-auto overflow-x-auto scrollbar-hide max-w-full">
          <button
            onClick={() => setActiveTab('compose')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap inline-flex items-center gap-1 ${
              activeTab === 'compose' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Rocket className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Soạn thảo
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap inline-flex items-center gap-1 ${
              activeTab === 'history' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <History className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Lịch sử gửi
          </button>
        </div>
      </div>

      {activeTab === 'compose' ? (
        <Card padding="lg" className="space-y-6 sm:space-y-8">
          {/* Step 1: Target Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-xs font-black shrink-0">1</span>
              Đối tượng nhận tin
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 px-2 sm:px-8">
              {loadingCounts ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-2xl bg-slate-100 animate-pulse" />
                ))
              ) : (
                targetOptions.map(opt => (
                  <label
                    key={opt.id}
                    className={`flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all cursor-pointer ${
                      target === opt.id ? 'border-amber-600 bg-amber-50/50' : 'border-slate-100 hover:border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <input
                        type="radio"
                        name="target"
                        checked={target === opt.id}
                        onChange={() => setTarget(opt.id)}
                        className="text-amber-600 focus:ring-amber-500 shrink-0"
                      />
                      <span className="text-xs sm:text-sm font-bold text-slate-700 truncate">{opt.label}</span>
                    </div>
                    <span className={`text-[9px] sm:text-[10px] font-black tracking-widest uppercase ${opt.color} whitespace-nowrap shrink-0 ml-2`}>
                      {targetCounts ? targetCounts[opt.id].toLocaleString('vi-VN') + ' người' : '...'}
                    </span>
                  </label>
                ))
              )}
            </div>

            {/* Custom recipients */}
            <div className="px-2 sm:px-8 space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Tùy chọn — Thêm độc giả cụ thể:
              </label>
              <div ref={searchRef} className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all placeholder:text-slate-400"
                    placeholder="Tìm theo tên, email, mã thẻ..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onFocus={() => { if (searchResults.length > 0) setShowDropdown(true) }}
                  />
                  {searching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Clock className="w-4 h-4 animate-spin text-slate-400" />
                    </div>
                  )}
                </div>
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto">
                    {searchResults.map(user => (
                      <button
                        key={user.id}
                        type="button"
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-amber-50 transition-colors text-left border-b border-slate-50 last:border-none"
                        onClick={() => selectRecipient(user)}
                      >
                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-bold shrink-0">
                          {user.fullName?.charAt(0) || user.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-slate-800 truncate">{user.fullName || user.username}</div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {user.email}{user.cardNumber ? ` · ${user.cardNumber}` : ''}
                          </div>
                        </div>
                        <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {recipients.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {recipients.map(r => (
                    <span key={r} className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-lg border border-amber-100">
                      {r}
                      <button type="button" onClick={() => removeRecipient(r)} className="hover:text-red-500 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Steps 2 & 3: Channel & Title */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-xs font-black shrink-0">2</span>
                Kênh gửi & Mẫu tin
              </h3>
              <div className="px-2 sm:px-8 space-y-4">
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked readOnly className="rounded border-slate-300 text-amber-600 focus:ring-amber-500" />
                    <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">Email</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-not-allowed opacity-50">
                    <input type="checkbox" disabled className="rounded border-slate-300" />
                    <span className="text-sm font-medium text-slate-600">SMS</span>
                  </label>
                </div>
                <Select
                  label="Chọn mẫu có sẵn"
                  value={template}
                  onChange={(e: any) => {
                    setTemplate(e.target.value)
                    if (e.target.value === 'overdue') {
                      setSubject('[Bookly] Nhắc nhở trả sách quá hạn')
                      setContent(`Kính gửi {{tên_độc_giả}},\n\nBạn đang có sách quá hạn {{số_ngày}} ngày. Vui lòng hoàn trả sách sớm để tránh phát sinh thêm phí phạt.\n\nTrân trọng,\nBan quản lý thư viện Bookly.`)
                    } else if (e.target.value === 'expiring') {
                      setSubject('[Bookly] Nhắc gia hạn thẻ thư viện')
                      setContent(`Kính gửi {{tên_độc_giả}},\n\nThẻ thư viện của bạn sắp hết hạn vào ngày {{ngày_hết_hạn}}. Vui lòng đến thư viện để gia hạn thẻ.\n\nTrân trọng,\nBan quản lý thư viện Bookly.`)
                    } else if (e.target.value === 'fine') {
                      setSubject('[Bookly] Nhắc thanh toán phí phạt')
                      setContent(`Kính gửi {{tên_độc_giả}},\n\nBạn đang còn nợ phí phạt {{số_tiền}}đ. Vui lòng thanh toán để tránh bị tạm ngừng dịch vụ thư viện.\n\nTrân trọng,\nBan quản lý thư viện Bookly.`)
                    }
                  }}
                >
                  <option value="">— Thông báo tự soạn —</option>
                  <option value="overdue">Nhắc trả sách quá hạn</option>
                  <option value="expiring">Nhắc gia hạn thẻ</option>
                  <option value="fine">Nhắc thanh toán phí phạt</option>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-xs font-black shrink-0">3</span>
                Tiêu đề thông báo
              </h3>
              <div className="px-2 sm:px-8">
                <Input
                  placeholder="Ví dụ: [Bookly] Nhắc nhở trả sách quá hạn"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Step 4: Content Editor */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-xs font-black shrink-0">4</span>
              Nội dung thông báo
            </h3>
            <div className="px-2 sm:px-8 space-y-3">
              <div className="relative group">
                <textarea
                  className="w-full h-40 sm:h-48 rounded-2xl bg-slate-50 border border-slate-200 p-4 sm:p-6 text-sm text-slate-700 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-sans leading-relaxed resize-none"
                  placeholder="Kính gửi {{tên_độc_giả}}, ..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                />
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                  <div className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-400">
                    {charCount} ký tự
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-full sm:w-auto mb-1 sm:mb-0">Biến động:</span>
                {['{{tên_độc_giả}}', '{{số_ngày}}', '{{tên_sách}}', '{{mã_thẻ}}', '{{số_tiền}}', '{{ngày_hết_hạn}}'].map(v => (
                  <button
                    key={v}
                    type="button"
                    className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-lg border border-amber-100 hover:bg-amber-100 transition-colors"
                    onClick={() => handleInsertVariable(v)}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex gap-2 justify-center sm:justify-start">
              <Button variant="ghost" className="font-bold text-slate-500 text-xs sm:text-sm" onClick={() => setShowPreview(true)}>
                <Eye className="w-4 h-4" /> Xem trước
              </Button>
              <Button variant="ghost" className="font-bold text-slate-500 text-xs sm:text-sm" onClick={handleSaveDraft}>
                <Save className="w-4 h-4" /> Lưu nháp
              </Button>
            </div>
            <Button
              variant="primary"
              className="font-bold shadow-glow shadow-amber-500/30 justify-center"
              onClick={handleSend}
              disabled={sending}
            >
              {sending ? <><Clock className="w-4 h-4 animate-spin" /> Đang gửi...</> : <><Rocket className="w-4 h-4" /> Gửi ngay</>}
            </Button>
          </div>
        </Card>
      ) : (
        /* ── History Tab ── */
        <Card padding="none" className="overflow-hidden border border-slate-100 shadow-sm rounded-3xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-4 sm:px-6 py-4 whitespace-nowrap">Ngày gửi</th>
                  <th className="px-4 sm:px-6 py-4 whitespace-nowrap">Tiêu đề</th>
                  <th className="px-4 sm:px-6 py-4 whitespace-nowrap">Đối tượng</th>
                  <th className="px-4 sm:px-6 py-4 text-center whitespace-nowrap">Người nhận</th>
                  <th className="px-4 sm:px-6 py-4 text-center whitespace-nowrap">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loadingHistory ? (
                  Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
                ) : historyError ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                          <AlertTriangle className="w-7 h-7 text-red-300" />
                        </div>
                        <p className="text-slate-500 font-medium">Không thể tải lịch sử thông báo</p>
                        <p className="text-slate-300 text-xs">Vui lòng kiểm tra kết nối và thử lại</p>
                        <Button variant="secondary" size="sm" className="mt-2 rounded-xl" onClick={fetchHistory}>
                          <RefreshCw className="w-3.5 h-3.5" /> Thử lại
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : history.length === 0 ? (
                  <EmptyState
                    icon={Bell}
                    title="Chưa có thông báo nào"
                    description="Các thông báo đã gửi sẽ hiển thị tại đây"
                  />
                ) : (
                  history.map(n => (
                    <tr key={n.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 sm:px-6 py-4 text-slate-500 font-medium whitespace-nowrap text-sm">
                        {new Date(n.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-4 sm:px-6 py-4 font-bold text-slate-800 text-sm max-w-[200px] truncate">{n.title}</td>
                      <td className="px-4 sm:px-6 py-4">
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg whitespace-nowrap">
                          {n.targetGroup ? (TARGET_LABELS as any)[n.targetGroup] || n.targetGroup : 'Danh sách tùy chỉnh'}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-center font-bold text-slate-700 text-sm">{n.recipientCount}</td>
                      <td className="px-4 sm:px-6 py-4 text-center">
                        {n.status === 'sent' ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 inline-flex items-center gap-1">
                            <Send className="w-3 h-3" /> Đã gửi
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                            <Save className="w-3 h-3" /> Nháp
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Preview Modal */}
      <Modal open={showPreview} onClose={() => setShowPreview(false)} title="Xem trước thông báo (Email)" size="md">
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
              Gửi đến: <span className="text-slate-900 ml-2">{targetCounts ? `${targetCounts[target].toLocaleString('vi-VN')} người` : '...'}</span>
            </p>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
              Tiêu đề: <span className="text-slate-900 ml-2">{subject || '[Bookly] Nhắc nhở trả sách quá hạn'}</span>
            </p>
          </div>
          <div className="p-4 sm:p-8 rounded-2xl bg-white border border-slate-100 shadow-inner min-h-[200px] sm:min-h-[300px] text-sm text-slate-700 leading-relaxed font-sans whitespace-pre-line">
            <div className="flex justify-center mb-6 sm:mb-8">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-600 rounded-xl flex items-center justify-center text-white text-lg sm:text-xl font-bold shadow-lg">B</div>
            </div>
            {previewContent}
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="ghost" className="justify-center" onClick={() => setShowPreview(false)}>Quay lại sửa</Button>
            <Button variant="primary" className="justify-center" onClick={handleSendTest} disabled={sendingTest}>
              {sendingTest ? <><Clock className="w-4 h-4 animate-spin" /> Đang gửi...</> : <><Rocket className="w-4 h-4" /> Gửi thử</>}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
