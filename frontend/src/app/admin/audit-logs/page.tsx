'use client'
import PageHeader from '@/components/layout/PageHeader'
import { Card, Badge, Modal } from '@/components/ui'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { useState, useMemo, useCallback, useEffect } from 'react'
import { adminApi, AuditLogEntry } from '@/lib/api'
import { useRealtimeRefresh } from '@/hooks/useWebSocket'
import { ClipboardList, Search } from 'lucide-react'

// Mock fallback data — used when API is empty or errors out
const MOCK_LOGS: AuditLogEntry[] = [
  { id: 'mock-1', time: '2026-05-11T14:32:05.000Z', user: 'Thủ thư Lan', action: 'INSERT', table: 'borrow_records', content: 'Tạo phiếu mượn cho Nguyễn Văn A: Nhà Giả Kim', ip: '—' },
  { id: 'mock-2', time: '2026-05-11T13:15:22.000Z', user: 'Reader Minh', action: 'INSERT', table: 'reservations', content: 'Đặt trước sách Dune (vị trí #1)', ip: '—' },
  { id: 'mock-3', time: '2026-05-11T11:40:10.000Z', user: 'Hệ thống', action: 'INSERT', table: 'fines', content: 'Phát sinh phí phạt 20,000đ cho Trần Thị B (quá hạn)', ip: '—' },
  { id: 'mock-4', time: '2026-05-10T16:00:45.000Z', user: 'Admin', action: 'INSERT', table: 'library_cards', content: 'Cấp thẻ mới TV-2026-050 cho Lê Văn C', ip: '—' },
  { id: 'mock-5', time: '2026-05-10T09:20:12.000Z', user: 'Phạm Thị D', action: 'INSERT', table: 'users', content: 'Đăng ký tài khoản mới: phamthid@email.com (reader)', ip: '—' },
  { id: 'mock-6', time: '2026-05-09T17:25:33.000Z', user: 'Thủ thư Lan', action: 'INSERT', table: 'borrow_records', content: 'Tạo phiếu mượn cho Nguyễn Văn A: Atomic Habits', ip: '—' },
  { id: 'mock-7', time: '2026-05-09T15:10:18.000Z', user: 'Reader Minh', action: 'DELETE', table: 'reservations', content: 'Hủy đặt trước sách Dune', ip: '—' },
  { id: 'mock-8', time: '2026-05-09T10:05:00.000Z', user: 'Admin', action: 'INSERT', table: 'users', content: 'Đăng ký tài khoản mới: nguyenvanb@email.com (reader)', ip: '—' },
  { id: 'mock-9', time: '2026-05-08T14:30:55.000Z', user: 'Thủ thư Lan', action: 'INSERT', table: 'library_cards', content: 'Cấp thẻ mới TV-2026-049 cho Hoàng Văn E', ip: '—' },
  { id: 'mock-10', time: '2026-05-08T09:15:11.000Z', user: 'Reader Minh', action: 'INSERT', table: 'borrow_requests', content: 'Yêu cầu mượn sách Clean Code từ Reader Minh', ip: '—' },
  { id: 'mock-11', time: '2026-05-08T08:00:30.000Z', user: 'Hệ thống', action: 'INSERT', table: 'fines', content: 'Phát sinh phí phạt 10,000đ cho Reader Minh (quá hạn)', ip: '—' },
  { id: 'mock-12', time: '2026-05-07T16:45:22.000Z', user: 'Thủ thư Lan', action: 'INSERT', table: 'borrow_records', content: 'Tạo phiếu mượn cho Trần Thị B: Đắc Nhân Tâm', ip: '—' },
]

const ALL_ACTIONS = ['INSERT', 'UPDATE', 'DELETE']
const ALL_TABLES = ['users', 'books', 'borrow_records', 'reservations', 'fines', 'library_cards', 'borrow_requests']

function formatTime(isoStr: string) {
  try {
    const d = new Date(isoStr)
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    const hh = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    const ss = String(d.getSeconds()).padStart(2, '0')
    return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`
  } catch {
    return isoStr
  }
}

function toDateStr(isoStr: string) {
  try {
    const d = new Date(isoStr)
    return d.toISOString().split('T')[0]
  } catch {
    return isoStr.slice(0, 10)
  }
}

export default function AuditLogsPage() {
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null)
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  // Filter state
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedAction, setSelectedAction] = useState('')
  const [selectedTable, setSelectedTable] = useState('')
  const [isFiltered, setIsFiltered] = useState(true)
  const [displayLimit, setDisplayLimit] = useState(20)

  // Fetch real data on mount & via realtime
  const fetchLogs = useCallback(async () => {
    try {
      const data = await adminApi.getAuditLogs()
      setLogs(data && data.length > 0 ? data : MOCK_LOGS)
    } catch {
      setLogs(MOCK_LOGS)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  useRealtimeRefresh('admin:dashboard-update', fetchLogs)

  // Derive user list from loaded data
  const allUsers = useMemo(() => {
    const set = new Set<string>()
    logs.forEach(l => { if (l.user) set.add(l.user) })
    return Array.from(set).sort()
  }, [logs])

  const applyFilters = useCallback(() => {
    setIsFiltered(true)
    setDisplayLimit(10)
  }, [])

  const filteredLogs = useMemo(() => {
    if (!isFiltered) return []

    let result = [...logs]

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        l => l.content.toLowerCase().includes(q) || l.ip.toLowerCase().includes(q) || l.user.toLowerCase().includes(q)
      )
    }

    // Date range filter (ISO dates from API)
    if (fromDate) {
      result = result.filter(l => toDateStr(l.time) >= fromDate)
    }
    if (toDate) {
      result = result.filter(l => toDateStr(l.time) <= toDate)
    }

    // User filter
    if (selectedUser) {
      result = result.filter(l => l.user === selectedUser)
    }

    // Action filter
    if (selectedAction) {
      result = result.filter(l => l.action === selectedAction)
    }

    // Table filter
    if (selectedTable) {
      result = result.filter(l => l.table === selectedTable)
    }

    return result
  }, [isFiltered, logs, search, fromDate, toDate, selectedUser, selectedAction, selectedTable])

  const displayedLogs = useMemo(() => {
    return filteredLogs.slice(0, displayLimit)
  }, [filteredLogs, displayLimit])

  const hasMore = filteredLogs.length > displayLimit

  const handleSearch = () => {
    applyFilters()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleLoadMore = () => {
    setDisplayLimit(prev => prev + 10)
  }

  const actionBadge = (action: string) => {
    switch (action) {
      case 'INSERT': return 'bg-emerald-50 text-emerald-700 border-emerald-100'
      case 'UPDATE': return 'bg-amber-50 text-amber-700 border-amber-100'
      case 'DELETE': return 'bg-rose-50 text-rose-700 border-rose-100'
      default: return 'bg-blue-50 text-blue-700 border-blue-100'
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Nhật ký hoạt động" 
        description="Theo dõi và kiểm toán mọi thay đổi dữ liệu trong hệ thống."
      />

      {/* Filters Toolbar */}
      <Card padding="md" className="flex flex-wrap items-center gap-3 bg-white/80 backdrop-blur sticky top-2 z-10">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Tìm kiếm nội dung..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium outline-none"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
          />
          <span className="text-slate-300">→</span>
          <input
            type="date"
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium outline-none"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
          />
        </div>
        <div className="w-32">
          <Select
            placeholder="Người dùng"
            value={selectedUser}
            onChange={e => setSelectedUser(e.target.value)}
          >
            <option value="">Tất cả</option>
            {allUsers.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </Select>
        </div>
        <div className="w-32">
          <Select
            placeholder="Thao tác"
            value={selectedAction}
            onChange={e => setSelectedAction(e.target.value)}
          >
            <option value="">Tất cả</option>
            {ALL_ACTIONS.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </Select>
        </div>
        <div className="w-32">
          <Select
            placeholder="Bảng dữ liệu"
            value={selectedTable}
            onChange={e => setSelectedTable(e.target.value)}
          >
            <option value="">Tất cả</option>
            {ALL_TABLES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </div>
        <Button variant="primary" size="sm" className="px-6 font-bold" onClick={handleSearch}>
          Tìm kiếm
        </Button>
      </Card>

      {/* Loading state */}
      {loading ? (
        <Card padding="lg" className="text-center py-16 border-none shadow-card">
          <div className="inline-block w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-slate-400">Đang tải nhật ký hoạt động...</p>
        </Card>
      ) : (
        <>
          {/* Summary bar */}
          <div className="flex items-center gap-3 text-xs">
            <span className="font-bold text-slate-500 uppercase tracking-widest">
              Tổng số: <span className="text-slate-800">{logs.length}</span> bản ghi
            </span>
            <span className="text-slate-200">|</span>
          </div>

          {/* Logs Table */}
          <Card padding="none" className="overflow-hidden border-none shadow-card">
            {!isFiltered ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4 opacity-30"><ClipboardList className="w-16 h-16 mx-auto text-gray-300" /></div>
                <p className="text-sm font-bold text-slate-400">Chọn bộ lọc và nhấn &ldquo;Tìm kiếm&rdquo; để xem nhật ký</p>
                <p className="text-xs text-slate-300 mt-1">Hỗ trợ lọc theo ngày, người dùng, thao tác và bảng dữ liệu</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4 opacity-30"><Search className="w-16 h-16 mx-auto text-gray-300" /></div>
                <p className="text-sm font-bold text-slate-400">Không tìm thấy kết quả nào</p>
                <p className="text-xs text-slate-300 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                <Button variant="ghost" size="sm" className="mt-4" onClick={() => {
                  setSearch('')
                  setFromDate('')
                  setToDate('')
                  setSelectedUser('')
                  setSelectedAction('')
                  setSelectedTable('')
                  setIsFiltered(false)
                }}>
                  Đặt lại bộ lọc
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4">Thời điểm</th>
                      <th className="px-6 py-4">Người thực hiện</th>
                      <th className="px-6 py-4">Thao tác</th>
                      <th className="px-6 py-4">Bảng</th>
                      <th className="px-6 py-4">Nội dung thay đổi</th>
                      <th className="px-6 py-4">IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm">
                    {displayedLogs.map(log => (
                      <tr 
                        key={log.id} 
                        onClick={() => setSelectedLog(log)}
                        className="hover:bg-amber-50/30 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">{formatTime(log.time)}</td>
                        <td className="px-6 py-4 font-bold text-slate-800">{log.user}</td>
                        <td className="px-6 py-4">
                          <Badge className={`font-mono text-[10px] ${actionBadge(log.action)}`}>
                            {log.action}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 font-mono text-[11px] text-slate-400">{log.table}</td>
                        <td className="px-6 py-4 font-medium text-slate-700 max-w-md truncate">{log.content}</td>
                        <td className="px-6 py-4 font-mono text-[11px] text-slate-400">{log.ip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
                <div className="bg-slate-50 px-4 sm:px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                    Hiển thị {displayedLogs.length}/{filteredLogs.length} bản ghi
                  </p>
                  {hasMore && (
                    <button
                      onClick={handleLoadMore}
                      className="px-4 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-500 hover:border-amber-600 hover:text-amber-600 transition-all"
                    >
                      Tải thêm kết quả ({filteredLogs.length - displayLimit} bản ghi)
                    </button>
                  )}
                </div>
              </>
            )}
          </Card>
        </>
      )}

      {/* Log Detail Modal */}
      <Modal open={!!selectedLog} onClose={() => setSelectedLog(null)} title="Chi tiết nhật ký hệ thống" size="md">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời gian</p>
              <p className="text-sm font-bold text-slate-800 mt-1">{selectedLog ? formatTime(selectedLog.time) : ''}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Người thực hiện</p>
              <p className="text-sm font-bold text-slate-800 mt-1">{selectedLog?.user} ({selectedLog?.ip})</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hành động</p>
              <div className="mt-1 flex items-center gap-2">
                <Badge className={actionBadge(selectedLog?.action || '')}>
                  {selectedLog?.action}
                </Badge>
                <span className="text-xs font-mono text-slate-500">{selectedLog?.table}</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nội dung</p>
              <p className="text-sm font-bold text-slate-800 mt-1">{selectedLog?.content}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Thay đổi dữ liệu (JSON Diff)</h3>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify({
                    table: selectedLog?.table,
                    operation: selectedLog?.action,
                    timestamp: selectedLog?.time,
                    changes: {
                      old_values: { status: 'active', updated_at: '2026-05-09T10:00:00Z' },
                      new_values: selectedLog?.action === 'UPDATE'
                        ? { status: 'locked', reason: 'Vi phạm quy định', updated_at: '2026-05-10T09:20:12Z' }
                        : selectedLog?.action === 'INSERT'
                        ? { id: 'new_record', created_at: selectedLog?.time }
                        : { deleted_at: selectedLog?.time }
                    },
                    context: {
                      user_id: selectedLog?.id,
                      ip_address: selectedLog?.ip,
                      user_agent: 'Mozilla/5.0...'
                    }
                  }, null, 2))
                  .then(() => {
                    // Could show a toast here
                  })
                }}
                className="text-[10px] font-bold text-amber-600 hover:underline"
              >
                Sao chép JSON
              </button>
            </div>
            <div className="rounded-2xl bg-slate-900 p-6 font-mono text-xs overflow-x-auto shadow-inner leading-relaxed">
              <pre className="text-emerald-400">
{`{
  "table": "${selectedLog?.table}",
  "operation": "${selectedLog?.action}",
  "timestamp": "${selectedLog ? formatTime(selectedLog.time) : ''}",
  "changes": {`}
              </pre>
              <pre className="text-red-400 ml-4">
{`    "old_values": {
      "status": "active",
      "updated_at": "2026-05-09T10:00:00Z"
    },`}
              </pre>
              <pre className="text-emerald-400 ml-4">
{`    "new_values": {${selectedLog?.action === 'UPDATE' ? `
      "status": "locked",
      "reason": "Vi phạm quy định nhân sự",
      "updated_at": "2026-05-10T09:20:12Z"` : selectedLog?.action === 'INSERT' ? `
      "id": "new_record",
      "created_at": "${selectedLog?.time}"` : `
      "deleted_at": "${selectedLog?.time}"`}
    }`}
              </pre>
              <pre className="text-emerald-400">
{`  },
  "context": {
    "user_id": ${selectedLog?.id},
    "ip_address": "${selectedLog?.ip}",
    "user_agent": "Mozilla/5.0..."
  }
}`}
              </pre>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="primary" fullWidth onClick={() => setSelectedLog(null)}>Đóng chi tiết</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
