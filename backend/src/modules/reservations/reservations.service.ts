import { Injectable, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In, LessThan } from 'typeorm'
import { Reservation } from './entities/reservation.entity'
import { Book } from '@/modules/books/entities/book.entity'
import { BookCopy } from '@/modules/books/entities/book-copy.entity'
import { LibraryCardsService } from '@/modules/library-cards/library-cards.service'
import { BorrowRecordsService } from '@/modules/borrow-records/borrow-records.service'
import { RealtimeGateway } from '@/common/websocket/realtime.gateway'

@Injectable()
export class ReservationsService {
    constructor(
        @InjectRepository(Reservation)
        private resRepo: Repository<Reservation>,
        @InjectRepository(Book)
        private bookRepo: Repository<Book>,
        @InjectRepository(BookCopy)
        private copyRepo: Repository<BookCopy>,
        private cardService: LibraryCardsService,
        private borrowService: BorrowRecordsService,
        private realtime: RealtimeGateway,
    ) { }

    async create(userId: string, bookId: string) {
        // Tìm thẻ thư viện của người dùng
        const cards = await this.cardService.findMine(userId)
        const activeCard = cards.find(c => c.status === 'active')
        
        if (!activeCard) {
            throw new BadRequestException('Bạn cần có thẻ thư viện đang hoạt động để đặt trước sách')
        }

        const book = await this.bookRepo.findOneBy({ id: bookId })
        if (!book) throw new BadRequestException('Sách không tồn tại')

        // Kiểm tra xem người dùng đã đặt cuốn này chưa
        const existing = await this.resRepo.findOne({
            where: { libraryCardId: activeCard.id, bookId: book.id, status: 'waiting' }
        })
        if (existing) {
            throw new BadRequestException('Bạn đã đặt trước cuốn sách này rồi')
        }

        // Kiểm tra xem sách có thực sự hết bản sao không
        if (book.availableCopies > 0) {
            throw new BadRequestException('Vẫn còn sách có sẵn, không cần đặt trước')
        }

        // Tính toán vị trí trong hàng đợi
        const count = await this.resRepo.count({
            where: { bookId, status: 'waiting' }
        })

        const reservation = this.resRepo.create({
            libraryCardId: activeCard.id,
            bookId: book.id,
            queuePosition: count + 1,
            status: 'waiting'
        })

        const saved = await this.resRepo.save(reservation)

        this.realtime.emit('librarian:dashboard-update')
        this.realtime.emit('admin:dashboard-update')
        this.realtime.emit('reader:dashboard-update')

        return saved
    }

    private async syncReservationsStatus() {
        // 1. Xử lý quá hạn
        const expiredReservations = await this.resRepo.find({
            where: { status: 'notified', expiresAt: LessThan(new Date()) }
        })

        for (const res of expiredReservations) {
            res.status = 'expired'
            await this.resRepo.save(res)

            if (res.reservedCopyId) {
                const copy = await this.copyRepo.findOne({ where: { id: res.reservedCopyId }, relations: { book: true } })
                if (copy && copy.status === 'reserved') {
                    copy.status = 'available'
                    await this.copyRepo.save(copy)

                    const book = copy.book
                    book.availableCopies += 1
                    await this.bookRepo.save(book)
                }
            }
        }

        // 2. Tự động cấp phát sách có sẵn cho người đang đợi
        const waitingReservations = await this.resRepo.find({
            where: { status: 'waiting' },
            order: { reservedAt: 'ASC' }
        })

        for (const res of waitingReservations) {                const availableCopy = await this.copyRepo.findOne({
                where: { bookId: res.bookId, status: 'available' },
                relations: { book: true }
            })

            if (availableCopy) {
                // Đặt bản sao này thành reserved
                availableCopy.status = 'reserved'
                await this.copyRepo.save(availableCopy)

                const book = availableCopy.book
                book.availableCopies -= 1
                await this.bookRepo.save(book)

                // Cập nhật reservation thành notified
                res.status = 'notified'
                res.notifiedAt = new Date()
                
                const expiresAt = new Date()
                expiresAt.setHours(expiresAt.getHours() + 48)
                res.expiresAt = expiresAt
                
                res.reservedCopyId = availableCopy.id
                await this.resRepo.save(res)
            }
        }
    }

    async findAll() {
        await this.syncReservationsStatus()
        return this.resRepo.find({
            relations: { libraryCard: { user: { profile: true } }, book: true },
            order: { reservedAt: 'ASC' }
        })
    }

    async cancel(id: string) {
        const res = await this.resRepo.findOneBy({ id })
        if (!res) throw new BadRequestException('Không tìm thấy yêu cầu đặt trước')
        
        res.status = 'cancelled'
        const saved = await this.resRepo.save(res)

        this.realtime.emit('librarian:dashboard-update')
        this.realtime.emit('admin:dashboard-update')
        this.realtime.emit('reader:dashboard-update')

        return saved
    }

    async notify(id: string) {
        const res = await this.resRepo.findOneBy({ id })
        if (!res) throw new BadRequestException('Không tìm thấy yêu cầu đặt trước')
        
        res.status = 'notified'
        res.notifiedAt = new Date()
        const saved = await this.resRepo.save(res)

        this.realtime.emit('librarian:dashboard-update')
        this.realtime.emit('admin:dashboard-update')
        this.realtime.emit('reader:dashboard-update')

        return saved
    }

    async fulfill(id: string, librarianId: string) {
        const res = await this.resRepo.findOneBy({ id })
        if (!res) throw new BadRequestException('Không tìm thấy yêu cầu đặt trước')
        if (res.status !== 'notified') throw new BadRequestException('Chỉ có thể cấp sách cho yêu cầu đã được thông báo')
        if (!res.reservedCopyId) throw new BadRequestException('Không tìm thấy bản sao sách được giữ cho yêu cầu này')

        // Tạo phiếu mượn thực tế
        await this.borrowService.borrow({
            cardId: res.libraryCardId,
            copyId: res.reservedCopyId
        }, librarianId, true)

        // Cập nhật trạng thái
        res.status = 'completed'
        const saved = await this.resRepo.save(res)

        // `borrowService.borrow()` ở trên đã emit dashboard-update cho borrow,
        // nhưng emit thêm để đảm bảo dashboard cập nhật trạng thái reservation
        this.realtime.emit('librarian:dashboard-update')
        this.realtime.emit('admin:dashboard-update')
        this.realtime.emit('reader:dashboard-update')

        return saved
    }

    async findMine(userId: string, query: any) {
        await this.syncReservationsStatus()
        
        const { status, page = 1, limit = 10 } = query
        const skip = (page - 1) * limit

        let statusFilter = undefined
        if (status) {
            statusFilter = status.includes(',') ? In(status.split(',')) : status
        }

        const [data, total] = await this.resRepo.findAndCount({
            where: {
                libraryCard: { userId },
                ...(statusFilter ? { status: statusFilter } : {})
            },
            relations: { book: true },
            order: { reservedAt: 'DESC' },
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

