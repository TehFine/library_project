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
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

type Tab = 'top' | 'stock' | 'replenish' | 'disposal'

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
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Báo cáo & Thống kê sách" 
          description="Theo dõi hiệu suất mượn sách và tình trạng kho sách thực tế."
        />
        <div className="flex gap-1 sm:gap-2">
          <Button variant="ghost" className="bg-white/50 border border-slate-200 text-[10px] sm:text-xs font-bold px-2 sm:px-4 py-1.5 sm:py-2" onClick={handleExportPDF}>
            Xuất PDF
          </Button>
          <Button variant="secondary" className="text-[10px] sm:text-xs font-bold px-2 sm:px-4 py-1.5 sm:py-2" onClick={handleExportExcel}>
            Xuất Excel
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-fit overflow-x-auto scrollbar-hide max-w-full pt-1">
        {[
          { id: 'top', label: 'Mượn nhiều nhất' },
          { id: 'stock', label: 'Tình trạng kho' },
          { id: 'replenish', label: 'Cần bổ sung' },
          { id: 'disposal', label: 'Cần thanh lý' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as Tab)}
            className={cn(
              'px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0',
              activeTab === t.id ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters (only for top tab) */}
      {activeTab === 'top' && (
        <Card padding="md" className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 bg-white/80 backdrop-blur">
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase ml-2 shrink-0">Khoảng thời gian:</span>
            <input type="date" className="bg-slate-50 border border-slate-200 rounded-lg px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium outline-none flex-1 sm:flex-none min-w-0" value={fromDate} onChange={e => setFromDate(e.target.value)} />
            <span className="text-slate-300 text-xs">→</span>
            <input type="date" className="bg-slate-50 border border-slate-200 rounded-lg px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium outline-none flex-1 sm:flex-none min-w-0" value={toDate} onChange={e => setToDate(e.target.value)} />
          </div>
          <div className="w-full sm:w-48">
            <Select placeholder="Tất cả thể loại" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
              <option value="1">Kỹ năng</option>
              <option value="2">Tiểu thuyết</option>
              <option value="3">Lịch sử</option>
            </Select>
          </div>
          <Button variant="primary" size="sm" className="px-6 font-bold w-full sm:w-auto" onClick={applyFilter}>Áp dụng</Button>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-20 text-slate-400 text-sm">Đang tải dữ liệu...</div>
      ) : !reportData ? (
        <div className="text-center py-20 text-slate-400 text-sm">Không thể tải dữ liệu. Vui lòng thử lại sau.</div>
      ) : (
        <>
          {/* Content - Top Borrowed */}
          {activeTab === 'top' && (
            <Card padding="none" className="overflow-hidden shadow-card border-none">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
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
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">
                        Không có dữ liệu phù hợp với bộ lọc
                      </td>
                    </tr>
                  ) : (
                    filteredBooks.map((b, i) => (
                      <tr key={b.rank} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-5 font-bold text-amber-600">#{b.rank}</td>
                        <td className="px-6 py-5">
                          <p className="text-sm font-bold text-slate-800">{b.title}</p>
                          <p className="text-xs text-slate-400">{b.author}</p>
                        </td>
                        <td className="px-6 py-5">
                          <Badge className="bg-slate-100 text-slate-600 border-slate-200">{b.category}</Badge>
                        </td>
                        <td className="px-6 py-5 text-center font-black text-slate-800">{b.totalBorrows} lượt</td>
                        <td className="px-6 py-5 text-center text-xs font-bold text-slate-500">{b.avgBorrowDays}</td>
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
              <Card padding="lg" className="bg-amber-600 text-white border-none shadow-glow">
                <h3 className="text-xs font-bold uppercase tracking-widest opacity-60">Tổng quan kho sách</h3>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-8">
                  <div>
                    <p className="text-3xl font-black italic">{stockSummary.totalCopies.toLocaleString()}</p>
                    <p className="text-xs font-medium opacity-80 mt-1">Tổng bản sao</p>
                  </div>
                  <div>
                    <p className="text-3xl font-black italic text-emerald-300">
                      {stockSummary.availableCopies.toLocaleString()} <span className="text-sm opacity-60">({availPct}%)</span>
                    </p>
                    <p className="text-xs font-medium opacity-80 mt-1">Đang có sẵn</p>
                  </div>
                  <div>
                    <p className="text-3xl font-black italic text-amber-300">{stockSummary.borrowedCopies.toLocaleString()}</p>
                    <p className="text-xs font-medium opacity-80 mt-1">Đang được mượn</p>
                  </div>
                  <div>
                    <p className="text-3xl font-black italic text-red-300">{reportData.disposal.length}</p>
                    <p className="text-xs font-medium opacity-80 mt-1">Sách cần xử lý</p>
                  </div>
                </div>
              </Card>

              <Card padding="none" className="overflow-hidden shadow-card border-none">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
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
                      <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">Không có dữ liệu</td></tr>
                    ) : (
                      reportData.stockStatus.map(s => (
                        <tr key={s.bookId} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-bold text-slate-800 text-sm">{s.title}</td>
                          <td className="px-6 py-4">
                            <Badge className="bg-slate-100 text-slate-600 border-slate-200">{s.category}</Badge>
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-slate-600">{s.totalCopies}</td>
                          <td className="px-6 py-4 text-center font-black">
                            <span className={s.availableCopies === 0 ? 'text-red-600' : 'text-emerald-600'}>
                              {s.availableCopies} {s.availableCopies === 0 ? <XCircle className="w-3.5 h-3.5 inline text-red-500" /> : <CheckCircle className="w-3.5 h-3.5 inline text-emerald-500" />}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center text-slate-600 font-medium">{s.borrowedCopies}</td>
                          <td className="px-6 py-4 text-right">
                            {s.action && (
                              <button className={cn(
                                "text-xs font-bold py-1 px-3 rounded-lg border inline-flex items-center gap-1.5",
                                s.critical ? "border-amber-100 bg-amber-50 text-amber-700 hover:bg-amber-100" : "border-slate-100 bg-slate-50 text-slate-500"
                              )}>
                                {s.critical ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5 text-slate-400" />}
                                {s.action}
                              </button>
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
            <Card padding="none" className="overflow-hidden shadow-card border-none">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Tên sách</th>
                    <th className="px-6 py-4 text-center">Bản sao hiện có</th>
                    <th className="px-6 py-4 text-center">Lượt đặt trước</th>
                    <th className="px-6 py-4 text-right">Đề xuất mua thêm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {displayReplenishment.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-400">Không có dữ liệu</td></tr>
                  ) : (
                    displayReplenishment.map((r, i) => (
                      <tr key={r.bookId}>
                        <td className="px-6 py-5 font-bold text-slate-800">{r.title}</td>
                        <td className="px-6 py-5 text-center text-slate-600 font-bold">{r.totalCopies}</td>
                        <td className="px-6 py-5 text-center">
                          <span className="text-red-600 font-black">{r.queueCount} người chờ</span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <Button variant="primary" size="sm" className="font-bold">
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
            <Card padding="none" className="overflow-hidden shadow-card border-none">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
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
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">Không có sách cần thanh lý</td></tr>
                  ) : (
                    reportData.disposal.map((d, i) => (
                      <tr key={d.copyCode + i}>
                        <td className="px-6 py-5 font-bold text-slate-800">{d.title}</td>
                        <td className="px-6 py-5 font-mono text-xs text-slate-500">{d.copyCode}</td>
                        <td className="px-6 py-5">
                          <Badge className={d.condition.includes('Hư hỏng') || d.condition.includes('Mất') ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'}>
                            {d.condition}
                          </Badge>
                        </td>
                        <td className="px-6 py-5 text-slate-500 font-medium">{d.importedAt}</td>
                        <td className="px-6 py-5 text-right">
                          <button className="text-xs font-bold text-red-600 px-3 py-1.5 rounded-lg border border-red-100 hover:bg-red-50">
                            {d.action}
                          </button>
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
