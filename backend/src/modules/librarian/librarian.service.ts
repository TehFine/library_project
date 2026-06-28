import { Injectable } from '@nestjs/common'
import { toLocalDateStr } from '@/common/utils/date'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, LessThan, MoreThanOrEqual, In } from 'typeorm'
import { BorrowRecord } from '../borrow-records/entities/borrow-record.entity'
import { Fine } from '../fines/entities/fine.entity'
import { Reservation } from '../reservations/entities/reservation.entity'
import { BorrowRequest } from '../borrow-requests/entities/borrow-request.entity'

@Injectable()
export class LibrarianService {
    constructor(
        @InjectRepository(BorrowRecord)
        private borrowRepo: Repository<BorrowRecord>,
        @InjectRepository(Fine)
        private fineRepo: Repository<Fine>,
        @InjectRepository(Reservation)
        private reservationRepo: Repository<Reservation>,
        @InjectRepository(BorrowRequest)
        private requestRepo: Repository<BorrowRequest>,
    ) { }

    async getStats(librarianId?: string) {
        const todayStr = toLocalDateStr()

        // Start of today
        const startOfToday = new Date(todayStr)

        // 1. Phiếu mượn hôm nay
        const borrowsToday = await this.borrowRepo.count({
            where: { borrowDate: todayStr }
        })

        // 2. Phiếu trả hôm nay
        const returnsToday = await this.borrowRepo.count({
            where: { returnDate: todayStr }
        })

        // 3. Số phiếu đang quá hạn
        const overdueCount = await this.borrowRepo.count({
            where: {
                status: In(['borrowing', 'overdue']),
                dueDate: LessThan(todayStr)
            }
        })

        // 4. Tiền mặt đã thu hôm nay — chỉ tính của thủ thư hiện tại (cash tại quầy)
        const cashQuery = this.fineRepo.createQueryBuilder('fine')
            .where('fine.status = :status', { status: 'paid' })
            .andWhere('fine.paidAt >= :startOfToday', { startOfToday })
            .andWhere('(fine.paymentMethod IS NULL OR fine.paymentMethod != :vnpayMethod)', { vnpayMethod: 'vnpay' })
        if (librarianId) {
            cashQuery.andWhere('fine.collectedById = :librarianId', { librarianId })
        }
        const cashFines = await cashQuery.getMany()
        const finesCollectedToday = cashFines.reduce((sum, f) => sum + Number(f.amount), 0)

        // 5. Thanh toán online hôm nay (tất cả VNPay, không phân biệt librarian)
        const onlineQuery = this.fineRepo.createQueryBuilder('fine')
            .leftJoinAndSelect('fine.borrowRecord', 'borrowRecord')
            .leftJoinAndSelect('borrowRecord.bookCopy', 'bookCopy')
            .leftJoinAndSelect('bookCopy.book', 'book')
            .leftJoinAndSelect('borrowRecord.libraryCard', 'libraryCard')
            .leftJoinAndSelect('libraryCard.user', 'user')
            .leftJoinAndSelect('user.profile', 'profile')
            .where('fine.status = :status', { status: 'paid' })
            .andWhere('fine.paidAt >= :startOfToday', { startOfToday })
            .andWhere('fine.paymentMethod = :vnpayMethod', { vnpayMethod: 'vnpay' })
            .orderBy('fine.paidAt', 'DESC')
            .take(20)
        const onlinePayments = await onlineQuery.getMany()
        const onlineCollectedToday = onlinePayments.reduce((sum, f) => sum + Number(f.amount), 0)
        const recentOnlinePayments = onlinePayments.slice(0, 10).map(f => ({
            id: f.id,
            amount: Number(f.amount),
            readerName: f.borrowRecord?.libraryCard?.user?.profile?.fullName ||
                        f.borrowRecord?.libraryCard?.user?.username || '—',
            bookTitle: f.borrowRecord?.bookCopy?.book?.title || '—',
            paidAt: f.paidAt,
        }))

        // 6. Danh sách quá hạn cần xử lý (chi tiết)
        const overdueList = await this.borrowRepo.find({
            where: {
                status: In(['borrowing', 'overdue']),
                dueDate: LessThan(todayStr)
            },
            relations: { bookCopy: { book: true }, libraryCard: { user: { profile: true } } },
            order: { dueDate: 'ASC' },
            take: 10
        })

        // 7. Sách đặt trước đã sẵn sàng (đã thông báo nhưng chưa mượn)
        const readyReservations = await this.reservationRepo.find({
            where: {
                status: 'notified'
            },
            relations: { book: true, libraryCard: { user: { profile: true } } },
            order: { notifiedAt: 'DESC' },
            take: 10
        })

        // 8. Yêu cầu mượn đang chờ
        const pendingRequests = await this.requestRepo.find({
            where: { status: 'pending' },
            relations: { book: true, libraryCard: { user: { profile: true } } },
            order: { requestedAt: 'ASC' },
            take: 10
        })
        const pendingRequestsCount = await this.requestRepo.count({
            where: { status: 'pending' }
        })

        return {
            borrowsToday,
            returnsToday,
            overdueCount,
            finesCollectedToday,
            onlineCollectedToday,
            recentOnlinePayments,
            pendingRequestsCount,
            overdueBooks: overdueList.map(b => {
                const due = new Date(b.dueDate)
                due.setHours(0, 0, 0, 0)
                const todayMidnight = new Date()
                todayMidnight.setHours(0, 0, 0, 0)
                const diffTime = todayMidnight.getTime() - due.getTime()
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
                return {
                    id: b.id,
                    title: b.bookCopy?.book?.title,
                    user: b.libraryCard?.user?.profile?.fullName || b.libraryCard?.user?.username,
                    days: diffDays
                }
            }),
            readyReservations: readyReservations.map(r => ({
                id: r.id,
                title: r.book?.title,
                user: r.libraryCard?.user?.profile?.fullName || r.libraryCard?.user?.username,
                queue: r.queuePosition
            })),
            pendingRequests: pendingRequests.map(r => ({
                id: r.id,
                title: r.book?.title,
                user: r.libraryCard?.user?.profile?.fullName || r.libraryCard?.user?.username,
                date: r.requestedAt
            }))
        }
    }

    async getPendingRequestsCount() {
        const borrowRequestCount = await this.requestRepo.count({
            where: { status: 'pending' }
        })
        const returnRequestCount = await this.borrowRepo.count({
            where: { returnRequested: true, status: In(['borrowing', 'overdue']) }
        })
        return { count: borrowRequestCount + returnRequestCount }
    }
}
