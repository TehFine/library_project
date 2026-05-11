import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Fine } from './entities/fine.entity'

@Injectable()
export class FinesService {
    constructor(
        @InjectRepository(Fine)
        private fineRepo: Repository<Fine>,
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

        const [data, total] = await this.fineRepo.findAndCount({
            where: {
                borrowRecord: { libraryCard: { userId } }
            },
            relations: ['borrowRecord', 'borrowRecord.bookCopy', 'borrowRecord.bookCopy.book'],
            order: { createdAt: 'DESC' },
            take: limit,
            skip: skip
        })

        return {
            data,
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / limit)
        }
    }
}

