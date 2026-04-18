'use client'
import { BorrowRecord } from '@/types'
import { formatDate, daysFromNow, borrowStatusMap, cn } from '@/lib/utils'
import { Badge, Card } from '@/components/ui'
import Button from '@/components/ui/Button'

interface BorrowCardProps {
  record: BorrowRecord
  onRenew?: (id: string) => void
  isRenewing?: boolean
}

export default function BorrowCard({ record, onRenew, isRenewing }: BorrowCardProps) {
  const statusInfo = borrowStatusMap[record.status]
  const daysLeft = daysFromNow(record.dueDate)
  const canRenew = record.status === 'borrowing' && record.renewalCount === 0 && daysLeft > 0

  const urgency =
    record.status === 'overdue' ? 'border-red-200' :
    daysLeft <= 2 && record.status === 'borrowing' ? 'border-orange-200' :
    'border-gray-200'

  return (
    <Card className={cn('border', urgency)} padding="none">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">
              {record.book?.title ?? 'Đang tải...'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {record.book?.author}
            </p>
          </div>
          <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          <div>
            <span className="text-gray-400">Ngày mượn</span>
            <p className="text-gray-700 font-medium">{formatDate(record.borrowDate)}</p>
          </div>
          <div>
            <span className="text-gray-400">Hạn trả</span>
            <p className={cn(
              'font-medium',
              record.status === 'overdue' ? 'text-red-600' :
              daysLeft <= 2 ? 'text-orange-600' : 'text-gray-700'
            )}>
              {formatDate(record.dueDate)}
            </p>
          </div>
          {record.status === 'borrowing' && (
            <div className="col-span-2">
              <span className={cn(
                'text-xs font-medium',
                record.status === 'overdue' ? 'text-red-600' :
                daysLeft <= 2 ? 'text-orange-600' : 'text-gray-500'
              )}>
                {daysLeft > 0 ? `Còn ${daysLeft} ngày` : `Quá hạn ${Math.abs(daysLeft)} ngày`}
              </span>
            </div>
          )}
          {record.status === 'returned' && (
            <div>
              <span className="text-gray-400">Ngày trả</span>
              <p className="text-gray-700 font-medium">{formatDate(record.returnDate)}</p>
            </div>
          )}
          {record.renewalCount > 0 && (
            <div>
              <span className="text-gray-400">Đã gia hạn</span>
              <p className="text-gray-700 font-medium">{record.renewalCount} lần</p>
            </div>
          )}
        </div>
      </div>

      {canRenew && onRenew && (
        <div className="px-4 pb-4">
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            loading={isRenewing}
            onClick={() => onRenew(record.id)}
          >
            Gia hạn thêm 14 ngày
          </Button>
        </div>
      )}
    </Card>
  )
}