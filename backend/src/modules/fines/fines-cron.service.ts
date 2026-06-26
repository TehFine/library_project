import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, LessThan } from 'typeorm'
import { toLocalDateStr } from '@/common/utils/date'
import { Fine } from './entities/fine.entity'
import { BorrowRecord } from '@/modules/borrow-records/entities/borrow-record.entity'
import { RealtimeGateway } from '@/common/websocket/realtime.gateway'

@Injectable()
export class FinesCronService {
    private readonly logger = new Logger(FinesCronService.name)

    constructor(
        @InjectRepository(Fine)
        private fineRepo: Repository<Fine>,
        @InjectRepository(BorrowRecord)
        private borrowRepo: Repository<BorrowRecord>,
        private realtime: RealtimeGateway,
    ) { }

    /**
     * Chạy mỗi giờ để tự động cập nhật phí phạt cho sách quá hạn.
     - Nếu chưa có fine: tạo mới
     - Nếu đã có fine (pending): cập nhật số ngày & số tiền mới nhất
     */
    @Cron(CronExpression.EVERY_HOUR)
    async processOverdueFines() {
        try {
            const todayStr = toLocalDateStr()

            // Tìm tất cả phiếu mượn đang quá hạn
            const overdueBorrows = await this.borrowRepo.find({
                where: [
                    { status: 'borrowing', dueDate: LessThan(todayStr) },
                    { status: 'overdue' },
                ],
            })

            if (overdueBorrows.length === 0) return

            // Map borrowRecordId -> existing fine (chỉ pending)
            const existingFines = new Map(
                (await this.fineRepo.find({
                    where: overdueBorrows.map(b => ({ borrowRecordId: b.id })),
                }))
                    .filter(f => f.status === 'pending')
                    .map(f => [f.borrowRecordId, f] as [string, Fine])
            )

            const changedFines: Fine[] = []
            const now = new Date()

            for (const record of overdueBorrows) {
                const dueDate = new Date(record.dueDate)
                dueDate.setHours(0, 0, 0, 0)
                const todayDate = new Date(todayStr)
                todayDate.setHours(0, 0, 0, 0)
                const diffTime = todayDate.getTime() - dueDate.getTime()
                const diffDays = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)))

                // Rates: 1000đ/ngày cho 5 ngày đầu, 3000đ/ngày từ ngày thứ 6
                const rateFirst5 = 1000
                const rateFrom6 = 3000
                let amount: number
                if (diffDays <= 5) {
                    amount = diffDays * rateFirst5
                } else {
                    amount = 5 * rateFirst5 + (diffDays - 5) * rateFrom6
                }

                const existing = existingFines.get(record.id)
                if (existing) {
                    // Cập nhật số ngày & số tiền mới nhất (chỉ update nếu có thay đổi)
                    if (existing.overdueDays !== diffDays || Number(existing.amount) !== amount) {
                        existing.overdueDays = diffDays
                        existing.amount = amount
                        changedFines.push(existing)
                    }
                } else {
                    // Tạo fine mới
                    const fine = this.fineRepo.create({
                        borrowRecordId: record.id,
                        fineType: 'overdue',
                        overdueDays: diffDays,
                        amount,
                        status: 'pending',
                        createdAt: now,
                    })
                    changedFines.push(fine)
                }
            }

            if (changedFines.length > 0) {
                await this.fineRepo.save(changedFines)
                this.logger.log(`Đã cập nhật ${changedFines.length} khoản phí phạt cho sách quá hạn`)
                this.realtime.emit('librarian:dashboard-update')
                this.realtime.emit('admin:dashboard-update')
                this.realtime.emit('reader:dashboard-update')
            }
        } catch (error) {
            this.logger.error('Lỗi khi xử lý phí phạt tự động:', error)
        }
    }
}
