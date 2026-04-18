import { LibraryCard } from '@/types'
import { formatDate, cardStatusMap } from '@/lib/utils'
import { Badge, Card } from '@/components/ui'
import { cn } from '@/lib/utils'

interface LibraryCardBadgeProps {
  card: LibraryCard | null
  className?: string
}

export default function LibraryCardBadge({ card, className }: LibraryCardBadgeProps) {
  if (!card) {
    return (
      <Card className={cn('border-dashed', className)}>
        <p className="text-sm text-gray-400 text-center py-2">Chưa có thẻ thư viện</p>
      </Card>
    )
  }

  const si = cardStatusMap[card.status]
  const isExpiringSoon = (() => {
    const days = Math.ceil((new Date(card.expiryDate).getTime() - Date.now()) / 86400000)
    return days > 0 && days <= 30
  })()

  return (
    <Card className={cn(
      'border',
      card.status === 'active' && !isExpiringSoon ? 'border-gray-200' :
      card.status === 'suspended' ? 'border-red-200 bg-red-50' :
      isExpiringSoon ? 'border-amber-200 bg-amber-50' : 'border-gray-200',
      className,
    )}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Thẻ thư viện</p>
        <Badge className={si.color}>{si.label}</Badge>
      </div>

      <p className="text-lg font-mono font-semibold text-gray-900 tracking-widest">
        {card.cardNumber}
      </p>

      <div className="flex gap-4 mt-2 text-xs text-gray-500">
        <span>Cấp: {formatDate(card.issuedDate)}</span>
        <span>Hết hạn: {formatDate(card.expiryDate)}</span>
      </div>

      {isExpiringSoon && (
        <p className="mt-2 text-xs text-amber-700">
          Thẻ sắp hết hạn — vui lòng đến thư viện để gia hạn.
        </p>
      )}
      {card.status === 'suspended' && (
        <p className="mt-2 text-xs text-red-700">
          Thẻ đang bị tạm khóa — liên hệ thư viện để được hỗ trợ.
        </p>
      )}
    </Card>
  )
}