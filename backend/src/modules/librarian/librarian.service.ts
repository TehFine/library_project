import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, LessThan, MoreThanOrEqual, Between } from 'typeorm'
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

    async getStats() {
        const today = new Date()
        const todayStr = today.toISOString().split('T')[0]

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
                status: 'borrowing',
                dueDate: LessThan(todayStr)
            }
        })

        // 4. Tiền phạt đã thu hôm nay
        const fines = await this.fineRepo.find({
            where: {
                status: 'paid',
                paidAt: MoreThanOrEqual(startOfToday)
            }
        })
        const finesCollectedToday = fines.reduce((sum, f) => sum + Number(f.amount), 0)

        // 5. Danh sách quá hạn cần xử lý (chi tiết)
        const overdueList = await this.borrowRepo.find({
            where: {
                status: 'borrowing',
                dueDate: LessThan(todayStr)
            },
            relations: { bookCopy: { book: true }, libraryCard: { user: { profile: true } } },
            order: { dueDate: 'ASC' },
            take: 10
        })

        // 6. Sách đặt trước đã sẵn sàng (đã thông báo nhưng chưa mượn)
        const readyReservations = await this.reservationRepo.find({
            where: {
                status: 'notified'
            },
            relations: { book: true, libraryCard: { user: { profile: true } } },
            order: { notifiedAt: 'DESC' },
            take: 10
        })

        // 7. Yêu cầu mượn đang chờ
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
            pendingRequestsCount,
            overdueBooks: overdueList.map(b => {
                const due = new Date(b.dueDate)
                const diffTime = today.getTime() - due.getTime()
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
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
}
