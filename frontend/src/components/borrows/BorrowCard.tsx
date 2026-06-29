import Image from 'next/image'
import { BorrowRecord } from '@/types'
import { formatDate, daysFromNow, borrowStatusMap, cn, getBookCoverUrl } from '@/lib/utils'
import { Badge, Card } from '@/components/ui'
import Button from '@/components/ui/Button'

interface BorrowCardProps {
  record: BorrowRecord & { returnRequested?: boolean }
  onRenew?: (id: string) => void
  onRequestReturn?: (id: string) => void
  isRenewing?: boolean
  isRequestingReturn?: boolean
}

export default function BorrowCard({ record, onRenew, onRequestReturn, isRenewing, isRequestingReturn }: BorrowCardProps) {
  const daysLeft = daysFromNow(record.dueDate)
  const isActuallyOverdue = record.status === 'overdue' || (record.status === 'borrowing' && daysLeft <= 0)
  
  const statusInfo = borrowStatusMap[isActuallyOverdue ? 'overdue' : record.status]
  const canRenew = (record.status === 'borrowing' || isActuallyOverdue) && record.renewalCount < 2
  
  const book = record.book || record.bookCopy?.book
  const coverSrc = book ? getBookCoverUrl(book) : null

  const urgency =
    isActuallyOverdue ? 'border-red-200 bg-red-50/30' :
    daysLeft <= 2 && record.status === 'borrowing' ? 'border-orange-200 bg-orange-50/30' :
    'border-gray-200 hover:border-amber-200 transition-colors'

  return (
    <Card className={cn('border overflow-hidden', urgency)} padding="none">
      <div className="flex gap-4 p-4">
        {/* Cover Mini */}
        <div className="w-20 aspect-[2/3] rounded-lg overflow-hidden bg-gray-100 shrink-0 shadow-sm relative">
          {coverSrc ? (
            <Image src={coverSrc} alt={book!.title} fill sizes="80px" className="object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-300">
               <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex justify-between items-start gap-2 mb-1">
            <h3 className="text-sm font-bold text-gray-900 truncate" title={book?.title}>
              {book?.title ?? 'Đang tải...'}
            </h3>
            <Badge className={cn('shrink-0 text-[10px] py-0 px-2 h-5 leading-tight', statusInfo.color)}>
              {statusInfo.label}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 truncate mb-3">{book?.author}</p>
          
          <div className="mt-auto grid grid-cols-2 gap-x-3 gap-y-2 text-[10px]">
            <div>
              <span className="text-gray-400 block mb-0.5 uppercase tracking-tighter">Ngày mượn</span>
              <p className="text-gray-800 font-semibold">{formatDate(record.borrowDate)}</p>
            </div>
            <div>
              <span className="text-gray-400 block mb-0.5 uppercase tracking-tighter">Hạn trả</span>
              <p className={cn(
                'font-bold',
                isActuallyOverdue ? 'text-red-600' :
                daysLeft <= 2 ? 'text-orange-600' : 'text-gray-800'
              )}>
                {formatDate(record.dueDate)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 flex items-center justify-between mt-1">
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-400 font-medium italic">Mã bản sao: {record.bookCopy?.copyCode || '—'}</span>
          {(record.status === 'borrowing' || isActuallyOverdue) && (
            <span className={cn(
              'text-[10px] font-bold mt-0.5',
              isActuallyOverdue ? 'text-red-500' :
              daysLeft <= 2 ? 'text-orange-500' : 'text-amber-600'
            )}>
              {daysLeft > 0 ? `Còn ${daysLeft} ngày` : `Quá hạn ${Math.abs(daysLeft)} ngày`}
            </span>
          )}
        </div>
        
        {canRenew && onRenew && (
          <Button
            variant="ghost"
            size="sm"
            className="text-amber-600 hover:bg-amber-50 h-8 px-3 rounded-lg border border-amber-200"
            loading={isRenewing}
            onClick={() => onRenew(record.id)}
          >
            Gia hạn
          </Button>
        )}
        {record.returnRequested ? (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg">
            <svg className="w-3.5 h-3.5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Đã yêu cầu trả
          </span>
        ) : onRequestReturn && (record.status === 'borrowing' || isActuallyOverdue) && (
          <Button
            variant="ghost"
            size="sm"
            className="text-blue-600 hover:bg-blue-50 h-8 px-3 rounded-lg border border-blue-200"
            loading={isRequestingReturn}
            onClick={() => onRequestReturn(record.id)}
          >
            Yêu cầu trả sách
          </Button>
        )}

      </div>
    </Card>
  )
}