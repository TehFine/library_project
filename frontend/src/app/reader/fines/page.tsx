'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import PageHeader from '@/components/layout/PageHeader'
import { Badge, Card, EmptyState, Pagination, Skeleton, StatCard } from '@/components/ui'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { finesApi } from '@/lib/api'
import { Fine, FineType } from '@/types'
import { formatCurrency, formatDate, fineStatusMap, fineTypeMap } from '@/lib/utils'
import { useRealtimeRefresh } from '@/hooks/useWebSocket'
import { useToast } from '@/hooks/useToast'
import { ExternalLink, CreditCard, ArrowRight, CheckCircle2, XCircle } from 'lucide-react'

export default function FinesPage() {
  const [fines, setFines]          = useState<Fine[]>([])
  const [total, setTotal]          = useState(0)
  const [page, setPage]            = useState(1)
  const [loading, setLoading]      = useState(true)
  const [paymentFine, setPaymentFine] = useState<Fine | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [vnpaySuccess, setVnpaySuccess] = useState<{
    fineId: string
    amount: number | null
    fineType: FineType | null
    paidAt: string | null
  } | null>(null)
  const [vnpayFail, setVnpayFail] = useState<{
    fineId: string
    message: string
  } | null>(null)
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const LIMIT = 12
  const prevPendingRef = useRef(0)

  async function load(p: number) {
    setLoading(true)
    try {
      const res = await finesApi.mine({ page: p, limit: LIMIT })
      if (Array.isArray(res)) {
        setFines(res)
        setTotal(res.length)
      } else if (res && res.data) {
        setFines(res.data)
        setTotal(res.total ?? res.data.length)
      } else {
        setFines([])
        setTotal(0)
      }
    } catch (err) {
      console.error('Failed to load fines:', err)
      setFines([])
      setTotal(0)
    } finally { setLoading(false) }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(page) }, [page])

  // Handle VNPay return result
  useEffect(() => {
    const vnpayStatus = searchParams.get('vnpay')
    const fineId = searchParams.get('fineId')

    if (vnpayStatus === 'success') {
      toast('Thanh toán VNPay thành công!', 'success')
      setVnpaySuccess({ fineId: fineId ?? '', amount: null, fineType: null, paidAt: null })
      load(page)
    } else if (vnpayStatus === 'fail') {
      const message = searchParams.get('message') ?? 'Thanh toán thất bại hoặc đã bị hủy'
      toast(message, 'error')
      setVnpayFail({ fineId: fineId ?? '', message })
    }
    // Clean URL params
    if (vnpayStatus) {
      window.history.replaceState({}, '', '/reader/fines')
    }
  }, [])

  // After fines load, update success popup with paid fine details
  useEffect(() => {
    if (vnpaySuccess && vnpaySuccess.amount === null && fines.length > 0) {
      const matched = fines.find(f => f.id === vnpaySuccess.fineId)
      if (matched) {
        setVnpaySuccess({
          fineId: matched.id,
          amount: matched.amount,
          fineType: matched.fineType,
          paidAt: matched.paidAt,
        })
      }
    }
  }, [fines, vnpaySuccess])

  const refresh = useCallback(() => { load(page) }, [page])
  useRealtimeRefresh('reader:dashboard-update', refresh)

  const pendingTotal = fines.filter(f => f.status === 'pending').reduce((s, f) => s + f.amount, 0)
  const paidTotal    = fines.filter(f => f.status === 'paid').reduce((s, f) => s + f.amount, 0)

  // Toast notification when new fines detected
  useEffect(() => {
    const newPending = fines.filter(f => f.status === 'pending').reduce((s, f) => s + f.amount, 0)
    if (newPending > prevPendingRef.current && prevPendingRef.current > 0) {
      toast(`Bạn có phí phạt mới: ${formatCurrency(newPending - prevPendingRef.current)}`, 'info')
    }
    prevPendingRef.current = newPending
  }, [fines, toast])

  function openPaymentModal(fine: Fine) {
    setPaymentFine(fine)
    setIsRedirecting(false)
  }

  function closePaymentModal() {
    setPaymentFine(null)
    setIsRedirecting(false)
  }

  async function handleVnpayPayment() {
    if (!paymentFine) return
    const id = paymentFine.id
    setIsRedirecting(true)
    try {
      const { paymentUrl } = await finesApi.vnpayPay(id)
      // Redirect user to VNPay payment page
      window.location.href = paymentUrl
    } catch (e: any) {
      console.error(e)
      toast(e?.message ?? 'Không thể tạo URL thanh toán VNPay', 'error')
      setIsRedirecting(false)
    }
  }

  return (
    <div>
      <PageHeader title="Phí phạt" description="Lịch sử phí phạt của bạn" />

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard label="Còn nợ" value={formatCurrency(pendingTotal)} sub="Cần thanh toán tại thư viện" />
        <StatCard label="Đã thanh toán" value={formatCurrency(paidTotal)} sub="Tổng đã nộp" />
      </div>

      {pendingTotal > 0 && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-800">Bạn còn {formatCurrency(pendingTotal)} chưa thanh toán</p>
              <p className="text-xs text-amber-600 mt-0.5">Vui lòng đến thư viện để thanh toán hoặc thanh toán online qua VNPay.</p>
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : fines.length === 0 ? (
        <EmptyState
          title="Không có phí phạt nào"
          description="Bạn luôn trả sách đúng hạn và giữ gìn sách tốt!"
          icon={
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {fines.map(f => {
            const si = fineStatusMap[f.status]
            return (
              <div key={f.id} className="flex flex-col sm:flex-row items-start gap-3 px-4 py-4 border-b border-gray-100 last:border-0">
                <div className="flex-1 min-w-0 w-full">
                  <p className="text-sm text-gray-600 truncate">{f.borrowRecord?.book?.title ?? '—'}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <Badge className={si.color}>{si.label}</Badge>
                    {f.isVirtual && (
                      <Badge className="bg-amber-50 text-amber-600 border border-amber-100">Phí tạm tính</Badge>
                    )}
                    <span className="text-xs text-gray-400">{fineTypeMap[f.fineType]}</span>
                    {f.fineType === 'overdue' && (
                      <span className="text-xs text-gray-400">{f.overdueDays} ngày</span>
                    )}
                  </div>
                  {f.status === 'paid' && (
                    <p className="text-xs text-gray-400 mt-1">Thanh toán {formatDate(f.paidAt)} &middot; Biên lai {f.receiptNumber}</p>
                  )}
                </div>
                <div className="text-left sm:text-right shrink-0 flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-2 w-full sm:w-auto justify-between sm:justify-start">
                  <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1">
                    <p className={`text-sm font-semibold ${f.status === 'pending' ? 'text-red-600' : 'text-gray-500'}`}>
                      {formatCurrency(f.amount)}
                    </p>
                    <p className="text-xs text-gray-400">{formatDate(f.createdAt)}</p>
                  </div>
                  {f.status === 'pending' && !f.isVirtual && (
                    <button
                      onClick={() => openPaymentModal(f)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors shrink-0"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Thanh toán VNPay
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Pagination page={page} totalPages={Math.ceil(total / LIMIT)} onPageChange={p => setPage(p)} />

      {/* VNPay Payment Modal */}
      <Modal
        open={paymentFine !== null}
        onClose={closePaymentModal}
        title="Thanh toán qua VNPay"
        description="Bạn sẽ được chuyển đến cổng thanh toán VNPay để hoàn tất"
        size="sm"
        footer={
          <div className="flex items-center gap-3 w-full">
            <Button variant="secondary" onClick={closePaymentModal} disabled={isRedirecting} className="flex-1">
              Hủy
            </Button>
            <Button variant="primary" onClick={handleVnpayPayment} loading={isRedirecting} className="flex-1 bg-blue-600 hover:bg-blue-700">
              {isRedirecting ? (
                'Đang chuyển hướng...'
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  Thanh toán {paymentFine ? formatCurrency(paymentFine.amount) : ''}
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </div>
        }
      >
        {paymentFine && (
          <div className="space-y-4">
            {/* Fine summary */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">Chi tiết phí phạt</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(paymentFine.amount)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {fineTypeMap[paymentFine.fineType]}
                    {paymentFine.fineType === 'overdue' && ` · ${paymentFine.overdueDays} ngày quá hạn`}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* VNPay info */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex items-start gap-3">
                <ExternalLink className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Sau khi nhấn <strong>&quot;Thanh toán&quot;</strong>, bạn sẽ được chuyển đến cổng thanh toán VNPay.</p>
                  <p>Bạn có thể thanh toán bằng:</p>
                  <ul className="list-disc list-inside text-xs text-gray-500 space-y-0.5 ml-1">
                    <li>Thẻ ATM nội địa (có Internet Banking)</li>
                    <li>Thẻ Visa/Mastercard quốc tế</li>
                    <li>QR Code qua ứng dụng ngân hàng</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Security note */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100">
              <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
              <p className="text-xs text-blue-600">Giao dịch được bảo mật bởi VNPay. Chúng tôi không lưu trữ thông tin thẻ của bạn.</p>
            </div>
          </div>
        )}
      </Modal>

      {/* VNPay Success Modal */}
      <Modal
        open={vnpaySuccess !== null}
        onClose={() => setVnpaySuccess(null)}
        title=""
        description=""
        size="sm"
        footer={
          <div className="flex items-center justify-center w-full">
            <Button
              variant="primary"
              onClick={() => setVnpaySuccess(null)}
              className="min-w-[120px] bg-green-600 hover:bg-green-700"
            >
              Đã hiểu
            </Button>
          </div>
        }
      >
        <div className="flex flex-col items-center text-center py-4">
          {/* Animated checkmark */}
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4 animate-bounce">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Thanh toán thành công!</h3>
          <p className="text-sm text-gray-500 mt-1">
            Khoản phí phạt đã được thanh toán qua VNPay
          </p>

          {vnpaySuccess?.amount !== null && vnpaySuccess?.amount !== undefined && (
            <div className="w-full mt-5 p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
              <p className="text-xs font-medium text-green-600 uppercase tracking-wider">
                Số tiền đã thanh toán
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {vnpaySuccess.amount ? formatCurrency(vnpaySuccess.amount) : ''}
              </p>
              {vnpaySuccess.fineType && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {fineTypeMap[vnpaySuccess.fineType]} &middot; Đã thanh toán xong
                </p>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-green-50 border border-green-100">
            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
            <p className="text-xs text-green-600">
              Giao dịch được bảo mật bởi VNPay. Biên lai đã được ghi nhận trong hệ thống.
            </p>
          </div>

          <p className="text-xs text-gray-400 mt-3">
            Mã giao dịch: {vnpaySuccess?.fineId?.substring(0, 8)}...
          </p>
        </div>
      </Modal>

      {/* VNPay Fail Modal */}
      <Modal
        open={vnpayFail !== null}
        onClose={() => setVnpayFail(null)}
        title=""
        description=""
        size="sm"
        footer={
          <div className="flex items-center gap-3 w-full">
            <Button variant="secondary" onClick={() => setVnpayFail(null)} className="flex-1">
              Đóng
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                const fail = vnpayFail
                if (!fail) return
                setVnpayFail(null)
                // Find the fine and open payment modal
                const fine = fines.find(f => f.id === fail.fineId)
                if (fine) openPaymentModal(fine)
              }}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              <span className="inline-flex items-center gap-1.5">
                <CreditCard className="w-4 h-4" />
                Thử lại
              </span>
            </Button>
          </div>
        }
      >
        <div className="flex flex-col items-center text-center py-4">
          {/* Error icon */}
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4 animate-bounce">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Thanh toán thất bại</h3>
          <p className="text-sm text-gray-500 mt-1">
            {vnpayFail?.message ?? 'Có lỗi xảy ra trong quá trình thanh toán'}
          </p>

          <div className="w-full mt-5 p-4 rounded-xl bg-gradient-to-br from-red-50 to-orange-50 border border-red-100">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
              <div className="text-left text-sm text-gray-600 space-y-1">
                <p>Giao dịch không thành công. Số tiền chưa được trừ khỏi tài khoản của bạn.</p>
                <p className="text-xs text-gray-500">Bạn có thể thử lại hoặc đến thư viện để được hỗ trợ.</p>
              </div>
            </div>
          </div>

          {vnpayFail?.fineId && (
            <p className="text-xs text-gray-400 mt-3">
              Mã giao dịch: {vnpayFail.fineId.substring(0, 8)}...
            </p>
          )}
        </div>
      </Modal>
    </div>
  )
}
