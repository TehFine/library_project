import Image from 'next/image'
import { Reservation } from '@/types'
import { formatDate, reservationStatusMap, cn, getBookCoverUrl } from '@/lib/utils'
import { Badge, Card } from '@/components/ui'
import Button from '@/components/ui/Button'

interface ReservationCardProps {
  reservation: Reservation
  onCancel?: (id: string) => void
  isCancelling?: boolean
}

export default function ReservationCard({ reservation, onCancel, isCancelling }: ReservationCardProps) {
  const statusInfo = reservationStatusMap[reservation.status]
  const book = reservation.book
  const coverSrc = book ? getBookCoverUrl(book) : null
  const canCancel = ['waiting', 'notified'].includes(reservation.status)

  const isNotified = reservation.status === 'notified'
  const urgency = isNotified ? 'border-green-200 bg-green-50/30' : 'border-gray-200 hover:border-amber-200 transition-colors'

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
              <span className="text-gray-400 block mb-0.5 uppercase tracking-tighter">Ngày đặt</span>
              <p className="text-gray-800 font-semibold">{formatDate(reservation.reservedAt)}</p>
            </div>
            {reservation.status === 'waiting' && (
               <div>
                  <span className="text-gray-400 block mb-0.5 uppercase tracking-tighter">Hàng đợi</span>
                  <p className="text-amber-600 font-bold">Vị trí: #{reservation.queuePosition}</p>
               </div>
            )}
            {reservation.status === 'notified' && (
              <div>
                <span className="text-gray-400 block mb-0.5 uppercase tracking-tighter">Hạn nhận sách</span>
                <p className="text-green-600 font-bold">{formatDate(reservation.expiresAt)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 flex items-center justify-between mt-1">
        <div className="flex flex-col">
          {reservation.status === 'notified' && (
             <span className="text-[10px] text-green-600 font-bold italic">Sách đã sẵn sàng!</span>
          )}
          {reservation.status === 'waiting' && (
             <span className="text-[10px] text-gray-400 font-medium italic">Đang chờ bản sao trống...</span>
          )}
        </div>
        
        {canCancel && onCancel && (
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:bg-gray-50 h-8 px-3 rounded-lg border border-gray-200"
            loading={isCancelling}
            onClick={() => onCancel(reservation.id)}
          >
            Hủy đặt trước
          </Button>
        )}
      </div>
    </Card>
  )
}
