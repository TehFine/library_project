import { cn, formatDate, getBookCoverUrl } from '@/lib/utils'
import Image from 'next/image'
import { MessageSquare, Check, ClipboardList } from 'lucide-react'

interface BorrowRequestCardProps {
  request: any
}

const STATUS_CONFIG = {
  pending:   { label: 'Đang chờ',    color: 'bg-amber-100 text-amber-700 border-amber-200',   dot: 'bg-amber-500' },
  approved:  { label: 'Đã duyệt',    color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  rejected:  { label: 'Từ chối',     color: 'bg-red-100 text-red-700 border-red-200',       dot: 'bg-red-500' },
  cancelled: { label: 'Đã hủy',      color: 'bg-gray-100 text-gray-500 border-gray-200',     dot: 'bg-gray-400' },
}

export default function BorrowRequestCard({ request }: BorrowRequestCardProps) {
  const book = request.book
  const coverSrc = book ? getBookCoverUrl(book) : null
  const status = request.status as keyof typeof STATUS_CONFIG
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending

  return (
    <div className="group flex items-start gap-4 p-4 rounded-2xl border border-gray-100 bg-white hover:border-amber-200 hover:shadow-sm transition-all duration-200">
      {/* Cover */}
      <div className="w-14 aspect-[2/3] rounded-lg overflow-hidden bg-gray-100 shrink-0 shadow-sm relative">
        {coverSrc ? (
          <Image src={coverSrc} alt={book!.title} fill sizes="56px" className="object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-300">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-gray-900 truncate" title={book?.title}>
              {book?.title ?? 'Đang tải...'}
            </h3>
            {book?.author && (
              <p className="text-xs text-gray-500 truncate mt-0.5">{book.author}</p>
            )}
          </div>
          <span className={cn(
            'shrink-0 inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold rounded-full border',
            cfg.color
          )}>
            <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
            {cfg.label}
          </span>
        </div>

        {/* Date */}
        <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-400">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Gửi: <span className="font-medium text-gray-600">{formatDate(request.requestedAt)}</span></span>
        </div>

        {/* Extra details for approved / rejected */}
        {status === 'rejected' && request.rejectionReason && (
          <div className="mt-2.5 flex items-start gap-2 p-2.5 bg-red-50 rounded-xl border border-red-100">
            <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-400" />
            <p className="text-[11px] text-red-600 leading-relaxed">
              <span className="font-semibold">Lý do: </span>
              {request.rejectionReason}
            </p>
          </div>
        )}

        {status === 'approved' && request.borrowRecord && (
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
            <p className="w-full text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" /> Đã cấp sách
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
              <span className="uppercase tracking-tighter">Mượn:</span>
              <span className="font-semibold text-gray-700">{formatDate(request.borrowRecord.borrowDate)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
              <span className="uppercase tracking-tighter">Hạn trả:</span>
              <span className="font-semibold text-emerald-700">{formatDate(request.borrowRecord.dueDate)}</span>
            </div>
            {request.borrowRecord.bookCopy?.copyCode && (
              <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                <span className="uppercase tracking-tighter">Mã BC:</span>
                <span className="font-semibold text-gray-700 font-mono">{request.borrowRecord.bookCopy.copyCode}</span>
              </div>
            )}
          </div>
        )}

        {status === 'approved' && !request.borrowRecord && (
          <div className="mt-2.5 flex items-center gap-2 p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
            <ClipboardList className="w-3.5 h-3.5 text-emerald-600" />
            <p className="text-[11px] text-emerald-700 font-medium">
              Đã chuyển thành phiếu mượn. Vui lòng đến quầy để nhận sách.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
