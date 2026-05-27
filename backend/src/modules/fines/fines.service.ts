import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, LessThan, Between } from 'typeorm'
import { Fine } from './entities/fine.entity'
import { BorrowRecord } from '@/modules/borrow-records/entities/borrow-record.entity'
import { RealtimeGateway } from '@/common/websocket/realtime.gateway'

@Injectable()
export class FinesService {
    constructor(
        @InjectRepository(Fine)
        private fineRepo: Repository<Fine>,
        @InjectRepository(BorrowRecord)
        private borrowRepo: Repository<BorrowRecord>,
        private realtime: RealtimeGateway,
    ) { }

    async findAll() {
        return this.fineRepo.find({
            relations: {
                borrowRecord: { libraryCard: { user: true }, bookCopy: { book: true } }
            },
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
        const saved = await this.fineRepo.save(fine)
        
        // Emit realtime events
        this.realtime.emit('librarian:dashboard-update')
        this.realtime.emit('admin:dashboard-update')
        this.realtime.emit('reader:dashboard-update')
        
        return saved
    }

    async waiveFine(id: string, librarianId: string, reason: string) {
        const fine = await this.fineRepo.findOneBy({ id })
        if (!fine) throw new NotFoundException('Fine record not found')
        fine.status = 'waived'
        fine.collectedBy = { id: librarianId } as any
        fine.paymentMethod = reason
        const saved = await this.fineRepo.save(fine)
        
        // Emit realtime events
        this.realtime.emit('librarian:dashboard-update')
        this.realtime.emit('admin:dashboard-update')
        this.realtime.emit('reader:dashboard-update')
        
        return saved
    }

    async simulatePayFine(id: string, userId: string) {
        const fine = await this.fineRepo.findOne({
            where: { id },
            relations: { borrowRecord: { libraryCard: true } }
        })
        if (!fine) throw new NotFoundException('Không tìm thấy khoản phí')
        if (fine.borrowRecord?.libraryCard?.userId !== userId) {
            throw new BadRequestException('Bạn không có quyền thanh toán khoản phí này')
        }
        if (fine.status !== 'pending') {
            throw new BadRequestException('Khoản phí này đã được xử lý')
        }

        // Gọi logic thanh toán giống librarian, mặc định method là 'online'
        return this.payFine(id, userId, 'online')
    }

    async getAdminFineStats(from?: string, to?: string, status?: string, fineType?: string) {
        const qb = this.fineRepo.createQueryBuilder('fine')
            .leftJoinAndSelect('fine.borrowRecord', 'borrowRecord')
            .leftJoinAndSelect('borrowRecord.libraryCard', 'libraryCard')
            .leftJoinAndSelect('libraryCard.user', 'user')
            .leftJoinAndSelect('user.profile', 'profile')
            .leftJoinAndSelect('borrowRecord.bookCopy', 'bookCopy')
            .leftJoinAndSelect('bookCopy.book', 'book')

        if (from) qb.andWhere('fine.createdAt >= :from', { from: new Date(from) })
        if (to) {
            const toDate = new Date(to)
            toDate.setHours(23, 59, 59, 999)
            qb.andWhere('fine.createdAt <= :to', { to: toDate })
        }
        if (status) qb.andWhere('fine.status = :status', { status })
        if (fineType) qb.andWhere('fine.fineType = :fineType', { fineType })

        qb.orderBy('fine.createdAt', 'DESC')

        const fines = await qb.getMany()

        const totalAmount = fines.reduce((s, f) => s + Number(f.amount), 0)
        const paidAmount = fines.filter(f => f.status === 'paid').reduce((s, f) => s + Number(f.amount), 0)
        const unpaidAmount = fines.filter(f => f.status === 'pending').reduce((s, f) => s + Number(f.amount), 0)
        const waivedAmount = fines.filter(f => f.status === 'waived').reduce((s, f) => s + Number(f.amount), 0)

        return {
            summary: { totalAmount, paidAmount, unpaidAmount, waivedAmount, totalCount: fines.length },
            transactions: fines.map(f => ({
                id: f.id,
                createdAt: f.createdAt,
                readerName: f.borrowRecord?.libraryCard?.user?.profile?.fullName ||
                            f.borrowRecord?.libraryCard?.user?.username || '—',
                bookTitle: f.borrowRecord?.bookCopy?.book?.title || '—',
                fineType: f.fineType,
                overdueDays: f.overdueDays,
                amount: Number(f.amount),
                status: f.status,
                paymentMethod: f.paymentMethod,
                receiptNumber: f.receiptNumber,
                paidAt: f.paidAt,
            }))
        }
    }

    calculateOverdueFine(days: number): number {
        if (days <= 0) return 0
        // Mẫu quy định: 1000đ/ngày cho 5 ngày đầu, 3000đ từ ngày thứ 6
        if (days <= 5) return days * 1000
        return 5000 + (days - 5) * 3000
    }

    async findMine(userId: string, query: any) {
        const { page = 1, limit = 10, status } = query
        const skip = (page - 1) * limit

        // 1. Lấy phí phạt thật trong DB
        const realFines = await this.fineRepo.find({
            where: {
                borrowRecord: { libraryCard: { userId } }
            },
            relations: { borrowRecord: { bookCopy: { book: true } } },
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
            relations: { bookCopy: { book: true } }
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

        const allFines = [...virtualFines, ...realFines]
            .filter(f => {
                // Virtual fines luôn là 'pending', real fines có thể có nhiều trạng thái
                if (!status) return true // Không lọc -> trả về tất cả
                return f.status === status
            })
            .sort((a, b) =>
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
