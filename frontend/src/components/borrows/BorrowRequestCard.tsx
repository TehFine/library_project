import { cn, formatDate } from '@/lib/utils'
import { Badge, Card } from '@/components/ui'
import Image from 'next/image'

interface BorrowRequestCardProps {
  request: any
}

export default function BorrowRequestCard({ request }: BorrowRequestCardProps) {
  const book = request.book
  const status = request.status

  const statusMap: any = {
    pending:  { label: 'Đang chờ duyệt', color: 'bg-amber-50 text-amber-700' },
    approved: { label: 'Đã phê duyệt',   color: 'bg-emerald-50 text-emerald-700' },
    rejected: { label: 'Bị từ chối',     color: 'bg-red-50 text-red-700' },
    cancelled: { label: 'Đã hủy',        color: 'bg-gray-100 text-gray-500' },
  }

  const currentStatus = statusMap[status] || statusMap.pending

  return (
    <Card className="border border-gray-100 overflow-hidden hover:border-amber-200 transition-colors" padding="none">
      <div className="flex gap-4 p-4">
        <div className="w-20 aspect-[2/3] rounded-lg overflow-hidden bg-gray-100 shrink-0 shadow-sm relative">
          {book?.coverUrl ? (
            <Image src={book.coverUrl} alt={book.title} fill className="object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-300">
               <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex justify-between items-start gap-2 mb-1">
            <h3 className="text-sm font-bold text-gray-900 truncate" title={book?.title}>
              {book?.title}
            </h3>
            <Badge className={cn('shrink-0 text-[10px] py-0 px-2 h-5 leading-tight border-none', currentStatus.color)}>
              {currentStatus.label}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 truncate mb-3">{book?.author}</p>
          
          <div className="mt-auto flex flex-col gap-1">
            <div className="flex justify-between text-[10px]">
                <span className="text-gray-400 uppercase tracking-tighter">Ngày yêu cầu</span>
                <span className="text-gray-700 font-bold">{formatDate(request.requestedAt)}</span>
            </div>
            {status === 'rejected' && request.rejectionReason && (
                <div className="mt-1 p-2 bg-red-50 rounded-lg border border-red-100">
                    <p className="text-[10px] text-red-600 font-medium italic">Lý do: {request.rejectionReason}</p>
                </div>
            )}
            {status === 'approved' && (
                <p className="text-[10px] text-emerald-600 font-bold italic mt-1">✓ Đã chuyển thành phiếu mượn. Vui lòng đến quầy để nhận sách.</p>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
