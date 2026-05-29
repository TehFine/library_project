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
import { Send, CheckCircle, ClipboardList, Bell, Download, Megaphone, FileSpreadsheet, FileText } from 'lucide-react'

type Tab = 'overdue' | 'frequent' | 'unpaid' | 'expiring'



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
        // Gửi nhắc nhở cá nhân
        await notificationApi.create({
          title: `Nhắc nhở ${remindTarget.type}`,
          content: `Thân gửi {{tên_độc_giả}},\n\nThư viện xin nhắc nhở bạn đang có sách ${remindTarget.type}. Vui lòng đến thư viện để xử lý kịp thời.\n\nTrân trọng,
Thư viện`,
          targetGroup: remindTarget.type === 'gia hạn thẻ' ? 'expiring' :
                       remindTarget.type === 'quá hạn' ? 'overdue' : undefined,
          customRecipients: remindTarget.cardNumber,
          variables: ['{{tên_độc_giả}}'],
          status: 'sent',
        })
      } else {
        // Gửi nhắc nhở tất cả độc giả quá hạn
        await notificationApi.create({
          title: 'Nhắc nhở sách quá hạn',
          content: `Thân gửi {{tên_độc_giả}},\n\nThư viện xin nhắc nhở bạn đang có sách quá hạn. Vui lòng trả sách và thanh toán phí phạt (nếu có) để tránh bị xử lý theo quy định.\n\nTrân trọng,
Thư viện`,
          targetGroup: 'overdue',
          variables: ['{{tên_độc_giả}}', '{{số_ngày}}', '{{tên_sách}}'],
          status: 'sent',
        })
      }
      setShowSendResult(true)
      setTimeout(() => setShowSendResult(false), 3000)
    } catch (err) {
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

  const handleExportExcel = async () => {
    const { exportToExcel } = await import('@/lib/export')
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

  const handleExportPDF = async () => {
    const { exportToPDF } = await import('@/lib/export')
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
    await exportToPDF(headers, rows, titles[activeTab], filenames[activeTab])
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Báo cáo vi phạm" 
          description="Quản lý độc giả quá hạn, nợ phí và thẻ sắp hết hạn."
        />
        <div className="flex gap-1 sm:gap-2">
          <Button variant="secondary" size="sm" className="font-bold text-[10px] sm:text-xs px-2 sm:px-4 py-1.5 sm:py-2" onClick={handleSendReminderAll}>
            <Bell className="w-3 h-3 sm:w-4 sm:h-4" /> Gửi nhắc nhở
          </Button>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="font-bold bg-white/50 border border-slate-200 text-[10px] sm:text-xs px-2 sm:px-4 py-1.5 sm:py-2" onClick={handleExportExcel}>
              <FileSpreadsheet className="w-3 h-3 sm:w-4 sm:h-4" /> Excel
            </Button>
            <Button variant="secondary" size="sm" className="font-bold text-[10px] sm:text-xs px-2 sm:px-4 py-1.5 sm:py-2" onClick={handleExportPDF}>
              <FileText className="w-3 h-3 sm:w-4 sm:h-4" /> PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl overflow-x-auto scrollbar-hide max-w-full pt-1">
        {[
          { id: 'overdue', label: `Đang quá hạn (${totals.overdue})`, color: 'text-red-600' },
          { id: 'frequent', label: `Quá hạn nhiều lần (${totals.frequent})` },
          { id: 'unpaid', label: `Còn nợ phí (${totals.unpaid})` },
          { id: 'expiring', label: `Thẻ sắp hết hạn (${totals.expiring})`, color: 'text-amber-600' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as Tab)}
            className={cn(
              'px-3 sm:px-6 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-sm font-bold transition-all duration-200 flex items-center gap-1 sm:gap-2 whitespace-nowrap shrink-0',
              activeTab === t.id ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="text-center py-20 text-slate-400 text-sm">Đang tải dữ liệu...</div>
      )}

      {!loading && (
        <>
          {/* Table Content */}
          <Card padding="none" className="overflow-hidden border-none shadow-card">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Độc giả</th>
                  <th className="px-6 py-4">Mã thẻ</th>
                  {activeTab === 'expiring' && <th className="px-6 py-4">Ngày hết hạn</th>}
                  {activeTab === 'frequent' && (
                    <>
                      <th className="px-6 py-4 text-center">Số lần</th>
                      <th className="px-6 py-4">Lần cuối</th>
                    </>
                  )}
                  {activeTab === 'unpaid' && (
                    <>
                      <th className="px-6 py-4">Số khoản nợ</th>
                      <th className="px-6 py-4 text-center">Tổng nợ</th>
                    </>
                  )}
                  {activeTab === 'overdue' && (
                    <>
                      <th className="px-6 py-4">Sách đang mượn</th>
                      <th className="px-6 py-4 text-center">Tình trạng</th>
                    </>
                  )}
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {currentList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  currentList.map((row: any, i: number) => (
                    <tr key={row.id || i} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                            row.status === 'critical' ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                          )}>
                            {(row.name || '').split(' ').pop()?.[0] || '?'}
                          </div>
                          <span className="font-bold text-slate-800">{row.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{row.cardNumber}</td>

                      {activeTab === 'expiring' && (
                        <td className="px-6 py-4 font-bold text-slate-700">{formatDate(row.expiryDate)}</td>
                      )}

                      {activeTab === 'frequent' && (
                        <>
                          <td className="px-6 py-4 text-center">
                            <Badge className="bg-red-50 text-red-700 border-red-100">
                              {row.violationCount} lần
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-slate-600">{formatDate(row.lastViolation)}</td>
                        </>
                      )}

                      {activeTab === 'unpaid' && (
                        <>
                          <td className="px-6 py-4 text-slate-600">{row.fineCount} khoản</td>
                          <td className="px-6 py-4 text-center font-black text-red-600">
                            {formatCurrency(row.totalAmount)}₫
                          </td>
                        </>
                      )}

                      {activeTab === 'overdue' && (
                        <>
                          <td className="px-6 py-4 text-slate-600">{row.bookTitle}</td>
                          <td className="px-6 py-4 text-center">
                            <Badge className={cn(
                              row.overdueDays > 5 ? "bg-red-50 text-red-700 border-red-100" : "bg-amber-50 text-amber-700 border-amber-100"
                            )}>
                              Quá hạn {row.overdueDays} ngày
                            </Badge>
                          </td>
                        </>
                      )}

                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1 sm:gap-2 flex-wrap">
                          {activeTab === 'expiring' ? (
                            <button
                              onClick={() => handleSendReminder(row.name, row.cardNumber, 'gia hạn thẻ')}
                              className="text-[10px] sm:text-xs font-bold text-amber-600 hover:bg-amber-50 px-2 sm:px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                            >
                              Gửi nhắc gia hạn
                            </button>
                          ) : activeTab === 'unpaid' ? (
                            <button
                              onClick={() => handleViewHistory(row.name, row.cardNumber)}
                              className="text-[10px] sm:text-xs font-bold text-slate-500 hover:bg-slate-100 px-2 sm:px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                            >
                              Xem chi tiết
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => handleSendReminder(row.name, row.cardNumber, 'quá hạn')}
                                className="text-[10px] sm:text-xs font-bold text-amber-600 hover:bg-amber-50 px-2 sm:px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                              >
                                Gửi nhắc nhở
                              </button>
                              <button
                                onClick={() => handleViewHistory(row.name, row.cardNumber)}
                                className="text-[10px] sm:text-xs font-bold text-slate-500 hover:bg-slate-100 px-2 sm:px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                              >
                                Xem lịch sử
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

            {/* Pagination */}
            {currentList.length > 0 && (
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                  Hiển thị {currentList.length}/{currentList.length} bản ghi
                </p>
                <div className="flex gap-1">
                  <button className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 flex items-center justify-center cursor-not-allowed">‹</button>
                  <button className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold">1</button>
                  <button className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-50 cursor-not-allowed">›</button>
                </div>
              </div>
            )}
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card padding="md" className="bg-red-50 border-red-100">
              <p className="text-2xl font-black text-red-600">{totals.overdue}</p>
              <p className="text-xs font-bold text-red-500 uppercase tracking-wider mt-1">Độc giả quá hạn</p>
            </Card>
            <Card padding="md" className="bg-amber-50 border-amber-100">
              <p className="text-2xl font-black text-amber-600">{totals.frequent}</p>
              <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mt-1">Quá hạn nhiều lần</p>
            </Card>
            <Card padding="md" className="bg-orange-50 border-orange-100">
              <p className="text-2xl font-black text-orange-600">{totals.unpaid}</p>
              <p className="text-xs font-bold text-orange-500 uppercase tracking-wider mt-1">Còn nợ phí</p>
            </Card>
            <Card padding="md" className="bg-sky-50 border-sky-100">
              <p className="text-2xl font-black text-sky-600">{totals.expiring}</p>
              <p className="text-xs font-bold text-sky-500 uppercase tracking-wider mt-1">Thẻ sắp hết hạn</p>
            </Card>
          </div>
        </>
      )}

      {/* Remind Modal */}
      <Modal open={showRemindModal} onClose={() => setShowRemindModal(false)} title="Gửi nhắc nhở" size="sm">
        <div className="space-y-4 text-center py-2">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-2"><Megaphone className="w-8 h-8 text-amber-500 animate-bounce" /></div>
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
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center"><ClipboardList className="w-5 h-5 text-amber-600" /></div>
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
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-800">
                        {record.bookCopy?.book?.title || record.book?.title || '—'}
                      </p>
                      <Badge className={cn(
                        record.status === 'returned' ? 'bg-emerald-50 text-emerald-700' :
                        isOverdue ? 'bg-red-50 text-red-700' :
                        'bg-amber-50 text-amber-700'
                      )}>
                        {record.status === 'returned' ? 'Đã trả' :
                         isOverdue ? 'Quá hạn' : 'Đang mượn'}
                      </Badge>
                    </div>
                    <div className="mt-1.5 flex gap-4 text-[10px] text-slate-500">
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
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          <span>Đã gửi nhắc nhở thành công!</span>
        </div>
      )}
    </div>
  )
}
