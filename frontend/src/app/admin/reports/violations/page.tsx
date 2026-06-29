'use client'
import { useState, useEffect, useCallback } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Card, Badge, Modal } from '@/components/ui'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { adminApi, borrowsApi, notificationApi, ViolationReportData } from '@/lib/api'
import type { BorrowRecord } from '@/types'
import { useRealtimeRefresh } from '@/hooks/useWebSocket'
import toast from 'react-hot-toast'
import {
  Send, CheckCircle, ClipboardList, Bell, Download, Megaphone,
  FileText, AlertTriangle, BookOpen, Timer, CreditCard, Calendar,
  UserX, RefreshCw, type LucideIcon,
} from 'lucide-react'
import { exportToExcel, exportToPDF } from '@/lib/export'

type Tab = 'overdue' | 'frequent' | 'unpaid' | 'expiring'

const TAB_CONFIG: { id: Tab; label: string; icon: LucideIcon; color: string }[] = [
  { id: 'overdue', label: 'Đang quá hạn', icon: Timer, color: 'text-red-600' },
  { id: 'frequent', label: 'Quá hạn nhiều lần', icon: UserX, color: 'text-amber-600' },
  { id: 'unpaid', label: 'Còn nợ phí', icon: CreditCard, color: 'text-orange-600' },
  { id: 'expiring', label: 'Thẻ sắp hết hạn', icon: Calendar, color: 'text-sky-600' },
]

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, j) => (
        <td key={j} className="px-4 sm:px-6 py-4">
          <div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: j === 0 ? '50%' : j === 1 ? '35%' : '40%' }} />
        </td>
      ))}
    </tr>
  )
}

function EmptyState({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description?: string }) {
  return (
    <tr>
      <td colSpan={7} className="py-16 text-center">
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

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function ViolationsReportPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overdue')
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<ViolationReportData | null>(null)
  const [showRemindModal, setShowRemindModal] = useState(false)
  const [remindTarget, setRemindTarget] = useState<{ name: string; cardNumber?: string; type: string } | null>(null)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [historyTarget, setHistoryTarget] = useState<{ name: string; cardNumber: string } | null>(null)
  const [historyData, setHistoryData] = useState<BorrowRecord[] | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [showSendResult, setShowSendResult] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminApi.getViolationReports()
      setReportData(data)
    } catch {
      toast.error('Không thể tải dữ liệu vi phạm')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])
  useRealtimeRefresh('admin:dashboard-update', fetchData)

  const displayOverdue = reportData?.overdueReaders || []
  const displayExpiring = reportData?.expiringCards || []
  const displayFrequent = reportData?.frequentViolators || []
  const displayUnpaid = reportData?.unpaidFines || []

  const totals = {
    overdue: reportData?.totals?.overdueCount ?? 0,
    frequent: reportData?.totals?.frequentCount ?? 0,
    unpaid: reportData?.totals?.unpaidCount ?? 0,
    expiring: reportData?.totals?.expiringCount ?? 0,
  }

  const handleSendReminder = (name: string, cardNumber: string, type: string) => {
    setRemindTarget({ name, cardNumber, type })
    setShowRemindModal(true)
  }

  const handleSendReminderAll = () => {
    setRemindTarget(null)
    setShowRemindModal(true)
  }

  const confirmSend = async () => {
    setShowRemindModal(false)
    try {
      if (remindTarget) {
        await notificationApi.create({
          title: `Nhắc nhở ${remindTarget.type}`,
          content: `Thân gửi {{tên_độc_giả}},\n\nThư viện xin nhắc nhở bạn đang có sách ${remindTarget.type}. Vui lòng đến thư viện để xử lý kịp thời.\n\nTrân trọng,\r\nThư viện`,
          targetGroup: remindTarget.type === 'gia hạn thẻ' ? 'expiring' :
                       remindTarget.type === 'quá hạn' ? 'overdue' : undefined,
          customRecipients: remindTarget.cardNumber,
          variables: ['{{tên_độc_giả}}'],
          status: 'sent',
        })
      } else {
        await notificationApi.create({
          title: 'Nhắc nhở sách quá hạn',
          content: `Thân gửi {{tên_độc_giả}},\n\nThư viện xin nhắc nhở bạn đang có sách quá hạn. Vui lòng trả sách và thanh toán phí phạt (nếu có) để tránh bị xử lý theo quy định.\n\nTrân trọng,\r\nThư viện`,
          targetGroup: 'overdue',
          variables: ['{{tên_độc_giả}}', '{{số_ngày}}', '{{tên_sách}}'],
          status: 'sent',
        })
      }
      setShowSendResult(true)
      setTimeout(() => setShowSendResult(false), 3000)
    } catch {
      toast.error('Gửi nhắc nhở thất bại')
    }
  }

  const handleViewHistory = async (name: string, cardNumber: string) => {
    setHistoryTarget({ name, cardNumber })
    setHistoryData(null)
    setShowHistoryModal(true)
    setHistoryLoading(true)
    try {
      const records = await borrowsApi.findByCardNumber(cardNumber)
      setHistoryData(records)
    } catch {
      setHistoryData([])
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleExportExcel = () => {
    const list = getCurrentList()
    if (list.length === 0) { toast.error('Không có dữ liệu để xuất'); return }

    const excelData = list.map((row: any) => {
      const base: Record<string, any> = {
        'Độc giả': row.name,
        'Mã thẻ': row.cardNumber,
      }
      if (activeTab === 'overdue') {
        base['Sách'] = row.bookTitle
        base['Quá hạn'] = `${row.overdueDays} ngày`
        base['Hạn trả'] = formatDate(row.dueDate)
      } else if (activeTab === 'frequent') {
        base['Số lần quá hạn'] = row.violationCount
        base['Lần cuối'] = formatDate(row.lastViolation)
      } else if (activeTab === 'unpaid') {
        base['Số khoản nợ'] = row.fineCount
        base['Tổng nợ'] = `${row.totalAmount.toLocaleString('vi-VN')}₫`
      } else if (activeTab === 'expiring') {
        base['Ngày hết hạn'] = formatDate(row.expiryDate)
      }
      return base
    })

    const tabNames: Record<string, string> = {
      overdue: 'Dang_Qua_Han',
      frequent: 'Qua_Han_Nhieu_Lan',
      unpaid: 'Con_No_Phi',
      expiring: 'The_Sap_Het_Han',
    }
    exportToExcel(excelData, `Bao_Cao_Vi_Pham_${tabNames[activeTab]}`, 'ViPham')
  }

  const handleExportPDF = () => {
    const list = getCurrentList()
    if (list.length === 0) { toast.error('Không có dữ liệu để xuất'); return }

    let headers: string[]
    let rows: (string | number)[][]

    if (activeTab === 'overdue') {
      headers = ['Độc giả', 'Mã thẻ', 'Sách', 'Quá hạn', 'Hạn trả']
      rows = list.map((r: any) => [r.name, r.cardNumber, r.bookTitle, `${r.overdueDays} ngày`, formatDate(r.dueDate)])
    } else if (activeTab === 'frequent') {
      headers = ['Độc giả', 'Mã thẻ', 'Số lần quá hạn', 'Lần cuối']
      rows = list.map((r: any) => [r.name, r.cardNumber, r.violationCount, formatDate(r.lastViolation)])
    } else if (activeTab === 'unpaid') {
      headers = ['Độc giả', 'Mã thẻ', 'Số khoản nợ', 'Tổng nợ']
      rows = list.map((r: any) => [r.name, r.cardNumber, r.fineCount, `${r.totalAmount.toLocaleString('vi-VN')}₫`])
    } else {
      headers = ['Độc giả', 'Mã thẻ', 'Ngày hết hạn']
      rows = list.map((r: any) => [r.name, r.cardNumber, formatDate(r.expiryDate)])
    }

    const titles: Record<string, string> = {
      overdue: 'Báo cáo độc giả quá hạn',
      frequent: 'Báo cáo độc giả quá hạn nhiều lần',
      unpaid: 'Báo cáo độc giả còn nợ phí',
      expiring: 'Báo cáo thẻ sắp hết hạn',
    }
    const filenames: Record<string, string> = {
      overdue: 'Bao_Cao_Qua_Han',
      frequent: 'Bao_Cao_Qua_Han_Nhieu_Lan',
      unpaid: 'Bao_Cao_Con_No_Phi',
      expiring: 'Bao_Cao_The_Sap_Het_Han',
    }
    exportToPDF(headers, rows, titles[activeTab], filenames[activeTab])
  }

  const getCurrentList = () => {
    switch (activeTab) {
      case 'overdue': return displayOverdue
      case 'frequent': return displayFrequent
      case 'unpaid': return displayUnpaid
      case 'expiring': return displayExpiring
    }
  }

  const currentList = getCurrentList()
  const formatCurrency = (amount: number) => amount.toLocaleString('vi-VN')

  const SUMMARY_CARDS = [
    { label: 'Độc giả quá hạn', value: totals.overdue, icon: Timer, bg: 'bg-red-50 border-red-100', text: 'text-red-600', sub: 'text-red-500' },
    { label: 'Quá hạn nhiều lần', value: totals.frequent, icon: UserX, bg: 'bg-amber-50 border-amber-100', text: 'text-amber-600', sub: 'text-amber-500' },
    { label: 'Còn nợ phí', value: totals.unpaid, icon: CreditCard, bg: 'bg-orange-50 border-orange-100', text: 'text-orange-600', sub: 'text-orange-500' },
    { label: 'Thẻ sắp hết hạn', value: totals.expiring, icon: Calendar, bg: 'bg-sky-50 border-sky-100', text: 'text-sky-600', sub: 'text-sky-500' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3">
        <PageHeader
          title="Báo cáo vi phạm"
          description="Quản lý độc giả quá hạn, nợ phí và thẻ sắp hết hạn."
        />
        <div className="flex gap-2 shrink-0 w-full sm:w-auto">
          <Button variant="secondary" size="sm" className="rounded-xl text-[10px] sm:text-xs font-bold flex-1 sm:flex-none justify-center" onClick={handleSendReminderAll}>
            <Bell className="w-3.5 h-3.5" /> Nhắc nhở
          </Button>
          <Button variant="secondary" size="sm" className="rounded-xl text-[10px] sm:text-xs font-bold flex-1 sm:flex-none justify-center hover:bg-amber-50 hover:border-amber-300 hover:shadow-md active:scale-[0.97]" onClick={handleExportExcel}>
            <Download className="w-3.5 h-3.5" /> Excel
          </Button>
          <Button variant="secondary" size="sm" className="rounded-xl text-[10px] sm:text-xs font-bold flex-1 sm:flex-none justify-center hover:bg-amber-50 hover:border-amber-300 hover:shadow-md active:scale-[0.97]" onClick={handleExportPDF}>
            <FileText className="w-3.5 h-3.5" /> PDF
          </Button>
        </div>
      </div>

      {/* Tabs with icons */}
      <div className="flex gap-1 bg-slate-50/80 p-1 rounded-2xl overflow-x-auto scrollbar-hide max-w-full">
        {TAB_CONFIG.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0',
                activeTab === t.id
                  ? 'bg-white text-amber-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/50',
              )}
            >
              <Icon className={cn('w-3.5 h-3.5 sm:w-4 sm:h-4', activeTab === t.id ? 'text-amber-500' : 'text-slate-400')} />
              <span>{t.label}</span>
              <span className={cn(
                'ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                activeTab === t.id ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-500',
              )}>
                {totals[t.id]}
              </span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      {loading ? (
        /* Skeleton loading */
        <Card padding="none" className="overflow-hidden border border-slate-100 shadow-sm rounded-3xl">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-4 sm:px-6 py-4">Độc giả</th>
                <th className="px-4 sm:px-6 py-4">Mã thẻ</th>
                <th className="px-4 sm:px-6 py-4">Chi tiết</th>
                <th className="px-4 sm:px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={4} />)}
            </tbody>
          </table>
        </Card>
      ) : !reportData ? (
        /* Error state */
        <Card padding="lg" className="text-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-red-300" />
            </div>
            <p className="text-slate-500 font-medium">Không thể tải dữ liệu vi phạm</p>
            <p className="text-slate-300 text-xs">Vui lòng kiểm tra kết nối và thử lại</p>
            <Button variant="secondary" size="sm" className="mt-3 rounded-xl" onClick={fetchData}>
              <RefreshCw className="w-3.5 h-3.5" /> Thử lại
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Table */}
          <Card padding="none" className="overflow-hidden border border-slate-100 shadow-sm rounded-3xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[640px]">
                <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-4 sm:px-6 py-4">Độc giả</th>
                    <th className="px-4 sm:px-6 py-4">Mã thẻ</th>
                    {activeTab === 'expiring' && <th className="px-4 sm:px-6 py-4">Ngày hết hạn</th>}
                    {activeTab === 'frequent' && (
                      <>
                        <th className="px-4 sm:px-6 py-4 text-center">Số lần</th>
                        <th className="px-4 sm:px-6 py-4">Lần cuối</th>
                      </>
                    )}
                    {activeTab === 'unpaid' && (
                      <>
                        <th className="px-4 sm:px-6 py-4">Số khoản nợ</th>
                        <th className="px-4 sm:px-6 py-4 text-center">Tổng nợ</th>
                      </>
                    )}
                    {activeTab === 'overdue' && (
                      <>
                        <th className="px-4 sm:px-6 py-4">Sách đang mượn</th>
                        <th className="px-4 sm:px-6 py-4 text-center">Tình trạng</th>
                      </>
                    )}
                    <th className="px-4 sm:px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {currentList.length === 0 ? (
                    <EmptyState
                      icon={BookOpen}
                      title="Không có dữ liệu vi phạm"
                      description={activeTab === 'overdue' ? 'Hiện không có độc giả nào quá hạn trả sách'
                        : activeTab === 'frequent' ? 'Chưa có độc giả nào vi phạm nhiều lần'
                        : activeTab === 'unpaid' ? 'Tất cả độc giả đã thanh toán đầy đủ phí'
                        : 'Không có thẻ nào sắp hết hạn trong thời gian tới'}
                    />
                  ) : (
                    currentList.map((row: any, i: number) => (
                      <tr key={row.id || i} className="hover:bg-slate-50/50 transition-colors group">
                        {/* Độc giả */}
                        <td className="px-4 sm:px-6 py-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className={cn(
                              "w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[10px] sm:text-xs font-bold shrink-0",
                              row.status === 'critical' ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                            )}>
                              {(row.name || '').split(' ').pop()?.[0] || '?'}
                            </div>
                            <span className="font-bold text-slate-800 text-sm truncate max-w-[100px] sm:max-w-none">{row.name}</span>
                          </div>
                        </td>

                        {/* Mã thẻ */}
                        <td className="px-4 sm:px-6 py-4">
                          <span className="font-mono text-[10px] sm:text-xs text-slate-500">{row.cardNumber}</span>
                        </td>

                        {activeTab === 'expiring' && (
                          <td className="px-4 sm:px-6 py-4 font-bold text-slate-700 text-sm whitespace-nowrap">{formatDate(row.expiryDate)}</td>
                        )}

                        {activeTab === 'frequent' && (
                          <>
                            <td className="px-4 sm:px-6 py-4 text-center">
                              <Badge className="bg-red-50 text-red-700 border-red-100">
                                {row.violationCount} lần
                              </Badge>
                            </td>
                            <td className="px-4 sm:px-6 py-4 text-slate-600 text-sm whitespace-nowrap">{formatDate(row.lastViolation)}</td>
                          </>
                        )}

                        {activeTab === 'unpaid' && (
                          <>
                            <td className="px-4 sm:px-6 py-4 text-slate-600 text-sm whitespace-nowrap">{row.fineCount} khoản</td>
                            <td className="px-4 sm:px-6 py-4 text-center font-black text-red-600 text-sm whitespace-nowrap">
                              {formatCurrency(row.totalAmount)}₫
                            </td>
                          </>
                        )}

                        {activeTab === 'overdue' && (
                          <>
                            <td className="px-4 sm:px-6 py-4 text-slate-600 text-sm max-w-[120px] sm:max-w-[180px] truncate">{row.bookTitle}</td>
                            <td className="px-4 sm:px-6 py-4 text-center">
                              <Badge className={cn(
                                "whitespace-nowrap",
                                row.overdueDays > 5 ? "bg-red-50 text-red-700 border-red-100" : "bg-amber-50 text-amber-700 border-amber-100"
                              )}>
                                Quá hạn {row.overdueDays} ngày
                              </Badge>
                            </td>
                          </>
                        )}

                        {/* Thao tác */}
                        <td className="px-4 sm:px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            {activeTab === 'expiring' ? (
                              <button
                                onClick={() => handleSendReminder(row.name, row.cardNumber, 'gia hạn thẻ')}
                                className="text-[10px] sm:text-xs font-bold text-amber-600 hover:bg-amber-50 px-2 sm:px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap inline-flex items-center gap-1"
                              >
                                <Bell className="w-3 h-3 sm:hidden" />
                                <span className="hidden sm:inline">Gửi nhắc gia hạn</span>
                                <span className="sm:hidden">Gia hạn</span>
                              </button>
                            ) : activeTab === 'unpaid' ? (
                              <button
                                onClick={() => handleViewHistory(row.name, row.cardNumber)}
                                className="text-[10px] sm:text-xs font-bold text-slate-500 hover:bg-slate-100 px-2 sm:px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap inline-flex items-center gap-1"
                              >
                                <ClipboardList className="w-3 h-3" />
                                <span className="hidden sm:inline">Xem chi tiết</span>
                                <span className="sm:hidden">Chi tiết</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleSendReminder(row.name, row.cardNumber, 'quá hạn')}
                                  className="text-[10px] sm:text-xs font-bold text-amber-600 hover:bg-amber-50 px-2 sm:px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap inline-flex items-center gap-1"
                                >
                                  <Bell className="w-3 h-3 sm:hidden" />
                                  <span className="hidden sm:inline">Gửi nhắc nhở</span>
                                  <span className="sm:hidden">Nhắc</span>
                                </button>
                                <button
                                  onClick={() => handleViewHistory(row.name, row.cardNumber)}
                                  className="text-[10px] sm:text-xs font-bold text-slate-500 hover:bg-slate-100 px-2 sm:px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap inline-flex items-center gap-1"
                                >
                                  <ClipboardList className="w-3 h-3" />
                                  <span className="hidden sm:inline">Xem lịch sử</span>
                                  <span className="sm:hidden">Sử</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            {currentList.length > 0 && (
              <div className="bg-slate-50/80 px-4 sm:px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium">
                  Hiển thị {currentList.length} bản ghi
                </p>
                <div className="flex gap-1 self-end sm:self-auto">
                  <button className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white border border-slate-200 text-slate-400 flex items-center justify-center cursor-not-allowed text-sm">‹</button>
                  <button className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs sm:text-sm">1</button>
                  <button className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-50 cursor-not-allowed text-sm">›</button>
                </div>
              </div>
            )}
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {SUMMARY_CARDS.map((c, i) => {
              const Icon = c.icon
              return (
                <Card key={i} padding="md" className={cn('border shadow-sm', c.bg)}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={cn('text-2xl sm:text-3xl font-black', c.text)}>{c.value}</p>
                      <p className={cn('text-[10px] sm:text-xs font-bold uppercase tracking-wider mt-1', c.sub)}>{c.label}</p>
                    </div>
                    <div className={cn('w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-white/60', c.text)}>
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {/* Remind Modal */}
      <Modal open={showRemindModal} onClose={() => setShowRemindModal(false)} title="Gửi nhắc nhở" size="sm">
        <div className="space-y-4 text-center py-2">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-2">
            <Megaphone className="w-8 h-8 text-amber-500 animate-bounce" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            {remindTarget
              ? `Gửi nhắc nhở ${remindTarget.type} đến ${remindTarget.name}?`
              : `Gửi nhắc nhở cho ${totals.overdue} độc giả quá hạn?`
            }
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed px-4">
            Hệ thống sẽ tự động gửi email thông báo dựa trên mẫu có sẵn.
          </p>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-left space-y-2">
            <div className="flex items-center gap-2">
              <input type="checkbox" checked readOnly className="rounded border-amber-300 text-amber-600" />
              <span className="text-[10px] font-bold text-slate-600">Gửi qua Email (Khuyên dùng)</span>
            </div>
            <div className="flex items-center gap-2 opacity-50">
              <input type="checkbox" disabled className="rounded border-slate-300" />
              <span className="text-[10px] font-bold text-slate-600">Gửi qua SMS (Chưa cấu hình)</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 pt-4">
            <Button variant="primary" fullWidth onClick={confirmSend}><Send className="w-4 h-4" /> Gửi ngay bây giờ</Button>
            <Button variant="ghost" fullWidth onClick={() => setShowRemindModal(false)}>Hủy</Button>
          </div>
        </div>
      </Modal>

      {/* History Modal */}
      <Modal open={showHistoryModal} onClose={() => setShowHistoryModal(false)} title="Lịch sử mượn trả" size="md">
        <div className="space-y-4 py-2">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">{historyTarget?.name}</h3>
              <p className="text-xs text-slate-500">Mã thẻ: <span className="font-mono font-bold text-slate-700">{historyTarget?.cardNumber}</span></p>
            </div>
          </div>

          {historyLoading ? (
            <div className="text-center py-8 text-sm text-slate-400">Đang tải lịch sử...</div>
          ) : !historyData || historyData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-slate-400">Chưa có lịch sử mượn trả.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {historyData.map(record => {
                const isOverdue = record.status === 'overdue' || (record.status === 'borrowing' && new Date(record.dueDate) < new Date())
                return (
                  <div key={record.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {record.bookCopy?.book?.title || record.book?.title || '—'}
                      </p>
                      <Badge className={cn(
                        'shrink-0',
                        record.status === 'returned' ? 'bg-emerald-50 text-emerald-700' :
                        isOverdue ? 'bg-red-50 text-red-700' :
                        'bg-amber-50 text-amber-700'
                      )}>
                        {record.status === 'returned' ? 'Đã trả' :
                         isOverdue ? 'Quá hạn' : 'Đang mượn'}
                      </Badge>
                    </div>
                    <div className="mt-1.5 flex flex-col sm:flex-row gap-1 sm:gap-4 text-[10px] text-slate-500">
                      <span>Mượn: {new Date(record.borrowDate).toLocaleDateString('vi-VN')}</span>
                      <span>Hạn: {new Date(record.dueDate).toLocaleDateString('vi-VN')}</span>
                      {record.returnDate && (
                        <span>Trả: {new Date(record.returnDate).toLocaleDateString('vi-VN')}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="pt-2">
            <Button variant="ghost" fullWidth onClick={() => setShowHistoryModal(false)}>Đóng</Button>
          </div>
        </div>
      </Modal>

      {/* Send Result Toast */}
      {showSendResult && (
        <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-bold z-50 animate-in slide-in-from-bottom-4">
          <CheckCircle className="w-5 h-5 text-emerald-300" />
          <span>Đã gửi nhắc nhở thành công!</span>
        </div>
      )}
    </div>
  )
}
