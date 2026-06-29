'use client'
import { AlertTriangle } from 'lucide-react'

export default function OffShiftBanner() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-amber-50/80 to-amber-100/50 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-amber-900 text-sm sm:text-base">
            Bạn hiện không trong ca trực
          </p>
          <p className="text-xs sm:text-sm text-amber-700 mt-1 leading-relaxed">
            Bạn có thể xem thông tin, nhưng các thao tác mượn/trả sách, thu phí, duyệt yêu cầu 
            và các thay đổi khác sẽ bị tạm khóa cho đến khi bắt đầu ca làm việc.
          </p>
        </div>
      </div>
    </div>
  )
}
