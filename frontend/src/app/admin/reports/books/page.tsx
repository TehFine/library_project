'use client'
import { useState, useEffect, useCallback } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Card, Badge } from '@/components/ui'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { cn } from '@/lib/utils'
import { adminApi, BookReportData } from '@/lib/api'
import { exportToExcel, exportToPDF } from '@/lib/export'
import { useRealtimeRefresh } from '@/hooks/useWebSocket'
import toast from 'react-hot-toast'
import { CheckCircle, XCircle, AlertTriangle, TrendingUp, Warehouse, RefreshCw, Trash2, Calendar, Filter, Download, FileText, BookOpen, Medal, BarChart3, type LucideIcon } from 'lucide-react'

type Tab = 'top' | 'stock' | 'replenish' | 'disposal'

const TABS = [
  { id: 'top' as Tab, label: 'Mượn nhiều nhất', icon: TrendingUp },
  { id: 'stock' as Tab, label: 'Tình trạng kho', icon: Warehouse },
  { id: 'replenish' as Tab, label: 'Cần bổ sung', icon: RefreshCw },
  { id: 'disposal' as Tab, label: 'Cần thanh lý', icon: Trash2 },
]

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, j) => (
        <td key={j} className="px-6 py-4">
          <div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: j === 1 ? '55%' : j === 2 ? '40%' : j === 0 ? '30%' : '50%' }} />
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

export default function BookReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('top')
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<BookReportData | null>(null)

  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [filteredBooks, setFilteredBooks] = useState<BookReportData['topBorrowed']>([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminApi.getBookReports()
      setReportData(data)
      setFilteredBooks(data.topBorrowed)
    } catch {
      toast.error('Không thể tải dữ liệu báo cáo sách')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])
  useRealtimeRefresh('admin:dashboard-update', fetchData)

  const applyFilter = () => {
    if (!reportData) return
    let result = reportData.topBorrowed
    if (selectedCategory) {
      const categoryMap: Record<string, string> = {
        '1': 'Kỹ năng',
        '2': 'Tiểu thuyết',
        '3': 'Lịch sử',
      }
      const catLabel = categoryMap[selectedCategory]
      if (catLabel) {
        result = result.filter(b => b.category === catLabel)
      }
    }
    setFilteredBooks(result)
  }

  const handleExportExcel = () => {
    if (!reportData) return
    if (activeTab === 'top') {
      exportToExcel(
        filteredBooks.map((b, i) => ({ '#': i + 1, 'Ten sach': b.title, 'Tac gia': b.author, 'The loai': b.category, 'Luot muon': b.totalBorrows, 'TB muon (ngay)': b.avgBorrowDays })),
        'Top_Sach_Muon_Nhieu', 'BaoCaoSach'
      )
    } else if (activeTab === 'stock') {
      exportToExcel(
        reportData.stockStatus.map(s => ({ 'Ten sach': s.title, 'The loai': s.category, 'Tong ban sao': s.totalCopies, 'Co san': s.availableCopies, 'Dang muon': s.borrowedCopies })),
        'Tinh_Trang_Kho', 'TinhTrangKho'
      )
    } else if (activeTab === 'replenish') {
      exportToExcel(
        displayReplenishment.map(r => ({ 'Ten sach': r.title, 'Ban sao hien co': r.totalCopies, 'Luot dat truoc': r.queueCount, 'De xuat': r.suggestion })),
        'Can_Bo_Sung', 'BoSung'
      )
    } else if (activeTab === 'disposal') {
      exportToExcel(
        reportData.disposal.map(d => ({ 'Ten sach': d.title, 'Ma ban sao': d.copyCode, 'Tinh trang': d.condition, 'Ngay nhap': d.importedAt, 'Hanh dong': d.action })),
        'Can_Thanh_Ly', 'ThanhLy'
      )
    }
  }

  const handleExportPDF = () => {
    if (!reportData) return
    if (activeTab === 'top') {
      exportToPDF(
        ['#', 'Ten sach', 'Tac gia', 'The loai', 'Luot muon', 'TB muon'],
        filteredBooks.map((b, i) => [i + 1, b.title, b.author, b.category, b.totalBorrows, b.avgBorrowDays]),
        'Top Sach Muon Nhieu Nhat', 'Top_Sach_Muon_Nhieu'
      )
    } else if (activeTab === 'stock') {
      exportToPDF(
        ['Ten sach', 'The loai', 'Tong BC', 'Co san', 'Dang muon'],
        reportData.stockStatus.map(s => [s.title, s.category, s.totalCopies, s.availableCopies, s.borrowedCopies]),
        'Tinh Trang Kho Sach', 'Tinh_Trang_Kho'
      )
    } else if (activeTab === 'replenish') {
      exportToPDF(
        ['Ten sach', 'Ban sao hien co', 'Luot dat truoc', 'De xuat mua them'],
        displayReplenishment.map(r => [r.title, r.totalCopies, r.queueCount, r.suggestion]),
        'Sach Can Bo Sung', 'Can_Bo_Sung'
      )
    } else if (activeTab === 'disposal') {
      exportToPDF(
        ['Ten sach', 'Ma ban sao', 'Tinh trang', 'Ngay nhap', 'Hanh dong'],
        reportData.disposal.map(d => [d.title, d.copyCode, d.condition, d.importedAt, d.action]),
        'Sach Can Thanh Ly', 'Can_Thanh_Ly'
      )
    }
  }

  const stockSummary = reportData ? reportData.stockStatus.reduce(
    (acc, s) => ({
      totalCopies: acc.totalCopies + s.totalCopies,
      availableCopies: acc.availableCopies + s.availableCopies,
      borrowedCopies: acc.borrowedCopies + s.borrowedCopies,
    }),
    { totalCopies: 0, availableCopies: 0, borrowedCopies: 0 }
  ) : { totalCopies: 0, availableCopies: 0, borrowedCopies: 0 }

  const availPct = stockSummary.totalCopies > 0
    ? Math.round((stockSummary.availableCopies / stockSummary.totalCopies) * 100)
    : 0

  const displayReplenishment = reportData?.replenishment || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3">
        <PageHeader 
          title="Báo cáo & Thống kê sách" 
          description="Theo dõi hiệu suất mượn sách và tình trạng kho sách thực tế."
        />
        <div className="flex gap-2 shrink-0">
          <Button variant="ghost" size="sm" className="rounded-xl border border-slate-200 text-xs font-bold" onClick={handleExportPDF}>
            <FileText className="w-3.5 h-3.5" /> PDF
          </Button>
          <Button variant="secondary" size="sm" className="rounded-xl text-xs font-bold" onClick={handleExportExcel}>
            <Download className="w-3.5 h-3.5" /> Excel
          </Button>
        </div>
      </div>

      {/* Tabs with icons */}
      <div className="flex gap-1 bg-slate-50/80 p-1 rounded-2xl w-fit overflow-x-auto scrollbar-hide max-w-full">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                'flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0',
                activeTab === t.id
                  ? 'bg-white text-amber-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/50',
              )}
            >
              <Icon className={cn('w-3.5 h-3.5 sm:w-4 sm:h-4', activeTab === t.id ? 'text-amber-500' : 'text-slate-400')} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Filters (only for top tab) */}
      {activeTab === 'top' && (
        <Card padding="md" className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 bg-white">
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="date"
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium outline-none flex-1 sm:flex-none min-w-0 focus:border-amber-300 focus:ring-2 focus:ring-amber-100 transition-all"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              placeholder="Từ ngày"
            />
            <span className="text-slate-300 text-xs">→</span>
            <input
              type="date"
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium outline-none flex-1 sm:flex-none min-w-0 focus:border-amber-300 focus:ring-2 focus:ring-amber-100 transition-all"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              placeholder="Đến ngày"
            />
          </div>
          <div className="w-full sm:w-44">
            <Select
              placeholder="Tất cả thể loại"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="rounded-xl text-xs"
            >
              <option value="1">Kỹ năng</option>
              <option value="2">Tiểu thuyết</option>
              <option value="3">Lịch sử</option>
            </Select>
          </div>
          <Button variant="primary" size="sm" className="rounded-xl px-5 font-bold w-full sm:w-auto" onClick={applyFilter}>
            <Filter className="w-3.5 h-3.5" /> Áp dụng
          </Button>
        </Card>
      )}

      {loading ? (
        /* Skeleton loading for each tab */
        activeTab === 'top' ? (
          <Card padding="none" className="overflow-hidden border border-slate-100 shadow-sm rounded-3xl">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <tr>
                  {['#', 'Tên sách / Tác giả', 'Thể loại', 'Lượt mượn', 'TB mượn (ngày)'].map(h => (
                    <th key={h} className="px-6 py-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={5} />)}
              </tbody>
            </table>
          </Card>
        ) : activeTab === 'stock' ? (
          <div className="space-y-6">
            <Card padding="lg" className="bg-slate-100 border-none animate-pulse">
              <div className="h-4 w-32 bg-slate-200 rounded" />
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-8">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i}>
                    <div className="h-8 w-20 bg-slate-200 rounded" />
                    <div className="h-3 w-16 bg-slate-200 rounded mt-2" />
                  </div>
                ))}
              </div>
            </Card>
            <Card padding="none" className="overflow-hidden border border-slate-100 shadow-sm rounded-3xl">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    {['Tên sách', 'Thể loại', 'Tổng BC', 'Có sẵn', 'Đang mượn', 'Thao tác'].map(h => (
                      <th key={h} className="px-6 py-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={6} />)}
                </tbody>
              </table>
            </Card>
          </div>
        ) : (
          <Card padding="none" className="overflow-hidden border border-slate-100 shadow-sm rounded-3xl">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <tr>
                  {['Tên sách', activeTab === 'replenish' ? 'Bản sao hiện có' : 'Mã bản sao', activeTab === 'replenish' ? 'Lượt đặt trước' : 'Tình trạng', activeTab === 'replenish' ? 'Đề xuất' : 'Ngày nhập', 'Thao tác'].map(h => (
                    <th key={h} className="px-6 py-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={5} />)}
              </tbody>
            </table>
          </Card>
        )
      ) : !reportData ? (
        /* Error state */
        <Card padding="lg" className="text-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-red-300" />
            </div>
            <p className="text-slate-500 font-medium">Không thể tải dữ liệu</p>
            <p className="text-slate-300 text-xs">Vui lòng kiểm tra kết nối và thử lại</p>
            <Button variant="secondary" size="sm" className="mt-3 rounded-xl" onClick={fetchData}>
              <RefreshCw className="w-3.5 h-3.5" /> Thử lại
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Content - Top Borrowed */}
          {activeTab === 'top' && (
            <Card padding="none" className="overflow-hidden border border-slate-100 shadow-sm rounded-3xl">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">#</th>
                    <th className="px-6 py-4">Tên sách / Tác giả</th>
                    <th className="px-6 py-4">Thể loại</th>
                    <th className="px-6 py-4 text-center">Lượt mượn</th>
                    <th className="px-6 py-4 text-center">TB mượn (ngày)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredBooks.length === 0 ? (
                    <EmptyState icon={BookOpen} title="Không có dữ liệu phù hợp với bộ lọc" description="Thử thay đổi khoảng thời gian hoặc thể loại" />
                  ) : (
                    filteredBooks.map((b, i) => (
                      <tr key={b.rank} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            {b.rank <= 3 ? (
                              <Medal className={cn(
                                'w-5 h-5',
                                b.rank === 1 ? 'text-amber-400' : b.rank === 2 ? 'text-slate-400' : 'text-amber-700'
                              )} />
                            ) : (
                              <span className="font-bold text-amber-600 text-sm">#{b.rank}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-sm font-bold text-slate-800">{b.title}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{b.author}</p>
                        </td>
                        <td className="px-6 py-5">
                          <Badge className="bg-slate-100 text-slate-600 border-slate-200">{b.category}</Badge>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className="font-black text-lg text-slate-800">{b.totalBorrows}</span>
                          <span className="text-xs text-slate-400 ml-1">lượt</span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className="text-sm font-bold text-slate-500">{b.avgBorrowDays}</span>
                          <span className="text-xs text-slate-400 ml-1">ngày</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </Card>
          )}

          {/* Content - Stock Status */}
          {activeTab === 'stock' && (
            <div className="space-y-6">
              {/* Summary card */}
              <Card padding="lg" className="bg-gradient-to-br from-amber-600 to-amber-700 text-white border-none shadow-lg">
                <h3 className="text-xs font-bold uppercase tracking-widest opacity-70 flex items-center gap-2">
                  <BarChart3 className="w-3.5 h-3.5" /> Tổng quan kho sách
                </h3>
                <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="bg-white/10 rounded-2xl p-4">
                    <p className="text-3xl font-black">{stockSummary.totalCopies.toLocaleString()}</p>
                    <p className="text-xs font-medium opacity-70 mt-1">Tổng bản sao</p>
                  </div>
                  <div className="bg-emerald-500/20 rounded-2xl p-4">
                    <p className="text-3xl font-black text-emerald-300">
                      {stockSummary.availableCopies.toLocaleString()} <span className="text-sm opacity-60">({availPct}%)</span>
                    </p>
                    <p className="text-xs font-medium opacity-80 mt-1">Đang có sẵn</p>
                  </div>
                  <div className="bg-amber-400/20 rounded-2xl p-4">
                    <p className="text-3xl font-black text-amber-300">{stockSummary.borrowedCopies.toLocaleString()}</p>
                    <p className="text-xs font-medium opacity-80 mt-1">Đang được mượn</p>
                  </div>
                  <div className="bg-red-400/20 rounded-2xl p-4">
                    <p className="text-3xl font-black text-red-300">{reportData.disposal.length}</p>
                    <p className="text-xs font-medium opacity-80 mt-1">Sách cần xử lý</p>
                  </div>
                </div>
              </Card>

              {/* Stock table */}
              <Card padding="none" className="overflow-hidden border border-slate-100 shadow-sm rounded-3xl">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4">Tên sách</th>
                      <th className="px-6 py-4">Thể loại</th>
                      <th className="px-6 py-4 text-center">Tổng BC</th>
                      <th className="px-6 py-4 text-center">Có sẵn</th>
                      <th className="px-6 py-4 text-center">Đang mượn</th>
                      <th className="px-6 py-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {reportData.stockStatus.length === 0 ? (
                      <EmptyState icon={Warehouse} title="Không có dữ liệu kho" description="Danh sách tình trạng kho sẽ hiển thị tại đây" />
                    ) : (
                      reportData.stockStatus.map(s => (
                        <tr key={s.bookId} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4 font-bold text-slate-800 text-sm">{s.title}</td>
                          <td className="px-6 py-4">
                            <Badge className="bg-slate-100 text-slate-600 border-slate-200">{s.category}</Badge>
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-slate-600">{s.totalCopies}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={cn(
                              'inline-flex items-center gap-1.5 font-black',
                              s.availableCopies === 0 ? 'text-red-600' : s.availableCopies <= 2 ? 'text-amber-600' : 'text-emerald-600'
                            )}>
                              {s.availableCopies}
                              {s.availableCopies === 0
                                ? <XCircle className="w-3.5 h-3.5" />
                                : s.availableCopies <= 2
                                  ? <AlertTriangle className="w-3.5 h-3.5" />
                                  : <CheckCircle className="w-3.5 h-3.5" />
                              }
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center text-slate-600 font-medium">{s.borrowedCopies}</td>
                          <td className="px-6 py-4 text-right">
                            {s.action && (
                              <Button
                                variant={s.critical ? 'danger' : 'ghost'}
                                size="sm"
                                className={cn(
                                  'rounded-lg text-[10px] font-bold',
                                  !s.critical && 'text-slate-500 border border-slate-200'
                                )}
                              >
                                {s.critical ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3 text-slate-400" />}
                                {s.action}
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          {/* Content - Replenishment */}
          {activeTab === 'replenish' && (
            <Card padding="none" className="overflow-hidden border border-slate-100 shadow-sm rounded-3xl">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Tên sách</th>
                    <th className="px-6 py-4 text-center">Bản sao hiện có</th>
                    <th className="px-6 py-4 text-center">Lượt đặt trước</th>
                    <th className="px-6 py-4 text-right">Đề xuất mua thêm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {displayReplenishment.length === 0 ? (
                    <EmptyState icon={RefreshCw} title="Không có dữ liệu cần bổ sung" description="Các đầu sách cần mua thêm sẽ hiển thị tại đây" />
                  ) : (
                    displayReplenishment.map((r, i) => (
                      <tr key={r.bookId} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-5 font-bold text-slate-800">{r.title}</td>
                        <td className="px-6 py-5 text-center text-slate-600 font-bold">{r.totalCopies}</td>
                        <td className="px-6 py-5 text-center">
                          <span className="text-red-600 font-black">{r.queueCount} người chờ</span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <Button variant="primary" size="sm" className="rounded-xl font-bold text-xs">
                            {r.suggestion}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </Card>
          )}

          {/* Content - Disposal */}
          {activeTab === 'disposal' && (
            <Card padding="none" className="overflow-hidden border border-slate-100 shadow-sm rounded-3xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Tên sách</th>
                    <th className="px-6 py-4">Mã bản sao</th>
                    <th className="px-6 py-4">Tình trạng</th>
                    <th className="px-6 py-4">Ngày nhập</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {reportData.disposal.length === 0 ? (
                    <EmptyState icon={CheckCircle} title="Không có sách cần thanh lý" description="Tất cả sách đều trong tình trạng tốt" />
                  ) : (
                    reportData.disposal.map((d, i) => (
                      <tr key={d.copyCode} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-5 font-bold text-slate-800">{d.title}</td>
                        <td className="px-6 py-5 font-mono text-xs text-slate-500">{d.copyCode}</td>
                        <td className="px-6 py-5">
                          <Badge className={d.condition.includes('Hư hỏng') || d.condition.includes('Mất') ? 'bg-red-50 text-red-700 border-red-100' : 'bg-slate-100 text-slate-600'}>
                            {d.condition}
                          </Badge>
                        </td>
                        <td className="px-6 py-5 text-slate-500 font-medium">{d.importedAt}</td>
                        <td className="px-6 py-5 text-right">
                          <Button variant="danger" size="sm" className="rounded-lg text-[10px] font-bold">
                            {d.action}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
