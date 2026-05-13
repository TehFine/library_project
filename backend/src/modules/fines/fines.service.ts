import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, LessThan } from 'typeorm'
import { Fine } from './entities/fine.entity'
import { BorrowRecord } from '@/modules/borrow-records/entities/borrow-record.entity'

@Injectable()
export class FinesService {
    constructor(
        @InjectRepository(Fine)
        private fineRepo: Repository<Fine>,
        @InjectRepository(BorrowRecord)
        private borrowRepo: Repository<BorrowRecord>,
    ) { }

    async findAll() {
        return this.fineRepo.find({
            relations: ['borrowRecord', 'borrowRecord.libraryCard', 'borrowRecord.libraryCard.user'],
            order: { createdAt: 'DESC' }
        })
    }

    async createFine(dto: Partial<Fine>) {
        const fine = this.fineRepo.create(dto)
        return this.fineRepo.save(fine)
    }

    async payFine(id: string, librarianId: string, method: string) {
        const fine = await this.fineRepo.findOneBy({ id })
        if (!fine) throw new NotFoundException('Fine record not found')

        fine.status = 'paid'
        fine.paidAt = new Date()
        fine.paymentMethod = method
        fine.collectedBy = { id: librarianId } as any
        fine.receiptNumber = `REC-${Date.now()}`

        return this.fineRepo.save(fine)
    }

    // Logic tính phí phạt dựa trên quy định
    calculateOverdueFine(days: number): number {
        if (days <= 0) return 0
        // Mẫu quy định: 1000đ/ngày cho 5 ngày đầu, 3000đ từ ngày thứ 6
        if (days <= 5) return days * 1000
        return 5000 + (days - 5) * 3000
    }

    async findMine(userId: string, query: any) {
        const { page = 1, limit = 10 } = query
        const skip = (page - 1) * limit

        // 1. Lấy phí phạt thật trong DB
        const realFines = await this.fineRepo.find({
            where: {
                borrowRecord: { libraryCard: { userId } }
            },
            relations: ['borrowRecord', 'borrowRecord.bookCopy', 'borrowRecord.bookCopy.book'],
            order: { createdAt: 'DESC' },
        })

        // 2. Tìm các phiếu mượn đang quá hạn nhưng chưa có record phạt
        const today = new Date()
        const todayStr = today.toISOString().split('T')[0]
        
        const overdueBorrows = await this.borrowRepo.find({
            where: {
                libraryCard: { userId },
                status: 'borrowing',
                dueDate: LessThan(todayStr)
            },
            relations: ['bookCopy', 'bookCopy.book']
        })

        const virtualFines = overdueBorrows
            .filter(b => !realFines.some(f => f.borrowRecordId === b.id))
            .map(b => {
                const dueDate = new Date(b.dueDate)
                // Reset hours to compare dates only
                const d1 = new Date(todayStr)
                const d2 = new Date(b.dueDate)
                const diffTime = d1.getTime() - d2.getTime()
                const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
                
                return {
                    id: `virtual-${b.id}`,
                    borrowRecord: b,
                    borrowRecordId: b.id,
                    fineType: 'overdue',
                    overdueDays: diffDays,
                    amount: this.calculateOverdueFine(diffDays),
                    status: 'pending',
                    createdAt: new Date(),
                    isVirtual: true // Đánh dấu để frontend biết đây là phí tạm tính
                }
            })

        const allFines = [...virtualFines, ...realFines].sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )

        const pagedData = allFines.slice(skip, skip + limit)
        const totalAmount = allFines
            .filter(f => f.status === 'pending')
            .reduce((sum, f) => sum + Number(f.amount), 0)

        return {
            data: pagedData,
            total: allFines.length,
            totalAmount: totalAmount,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(allFines.length / limit)
        }
    }
}

