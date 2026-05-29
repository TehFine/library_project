import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, LessThan } from 'typeorm'
import { Fine } from './entities/fine.entity'
import { BorrowRecord } from '@/modules/borrow-records/entities/borrow-record.entity'

@Injectable()
export class FinesCronService {
    private readonly logger = new Logger(FinesCronService.name)

    constructor(
        @InjectRepository(Fine)
        private fineRepo: Repository<Fine>,
        @InjectRepository(BorrowRecord)
        private borrowRepo: Repository<BorrowRecord>,
    ) { }

    /**
     * Chạy mỗi giờ để tự động tạo phí phạt cho sách quá hạn.
     * Chỉ tạo phí cho những phiếu mượn quá hạn chưa có bản ghi phí.
     */
    @Cron(CronExpression.EVERY_HOUR)
    async processOverdueFines() {
        try {
            const todayStr = new Date().toISOString().split('T')[0]

            // Tìm tất cả phiếu mượn đang quá hạn
            const overdueBorrows = await this.borrowRepo.find({
                where: [
                    { status: 'borrowing', dueDate: LessThan(todayStr) },
                    { status: 'overdue' },
                ],
            })

            if (overdueBorrows.length === 0) {
                return
            }

            // Lấy tất cả Fine record đã tồn tại để tránh tạo trùng
            const existingFineIds = new Set(
                (await this.fineRepo.find({
                    where: overdueBorrows.map(b => ({ borrowRecordId: b.id })),
                })).map(f => f.borrowRecordId)
            )

            const now = new Date()
            const newFines: Fine[] = []

            for (const record of overdueBorrows) {
                if (existingFineIds.has(record.id)) continue

                const dueDate = new Date(record.dueDate)
                const todayDate = new Date(todayStr)
                const diffTime = todayDate.getTime() - dueDate.getTime()
                const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))

                let amount: number
                if (diffDays <= 5) {
                    amount = diffDays * 1000
                } else {
                    amount = 5000 + (diffDays - 5) * 3000
                }

                const fine = this.fineRepo.create({
                    borrowRecordId: record.id,
                    fineType: 'overdue',
                    overdueDays: diffDays,
                    amount,
                    status: 'pending',
                    createdAt: now,
                })

                newFines.push(fine)
            }

            if (newFines.length > 0) {
                await this.fineRepo.save(newFines)
                this.logger.log(`Đã tự động tạo ${newFines.length} khoản phí phạt cho sách quá hạn`)
            }
        } catch (error) {
            this.logger.error('Lỗi khi xử lý phí phạt tự động:', error)
        }
    }
}
