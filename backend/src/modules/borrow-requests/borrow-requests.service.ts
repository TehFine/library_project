import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { BorrowRequest } from './entities/borrow-request.entity'
import { LibraryCard } from '../library-cards/entities/library-card.entity'
import { Book } from '../books/entities/book.entity'
import { BorrowRecord } from '../borrow-records/entities/borrow-record.entity'
import { BorrowRecordsService } from '../borrow-records/borrow-records.service'
import { Fine } from '../fines/entities/fine.entity'
import { Reservation } from '../reservations/entities/reservation.entity'
import { RealtimeGateway } from '@/common/websocket/realtime.gateway'

@Injectable()
export class BorrowRequestsService {
    constructor(
        @InjectRepository(BorrowRequest)
        private requestRepo: Repository<BorrowRequest>,
        @InjectRepository(LibraryCard)
        private cardRepo: Repository<LibraryCard>,
        @InjectRepository(Book)
        private bookRepo: Repository<Book>,
        @InjectRepository(BorrowRecord)
        private borrowRecordRepo: Repository<BorrowRecord>,
        @InjectRepository(Fine)
        private fineRepo: Repository<Fine>,
        @InjectRepository(Reservation)
        private resRepo: Repository<Reservation>,
        private borrowRecordsService: BorrowRecordsService,
        private realtime: RealtimeGateway,
    ) { }

    async create(userId: string, bookId: string) {
        // KIỂM TRA: Thẻ thư viện — phải có thẻ đang hoạt động
        const card = await this.cardRepo.findOne({ where: { userId }, relations: { user: true } })
        if (!card) throw new BadRequestException('Bạn cần có thẻ thư viện để mượn sách')
        if (card.status === 'locked') {
            throw new BadRequestException('Thẻ thư viện của bạn đã bị khóa do có phí phạt chưa thanh toán. Vui lòng thanh toán phí phạt để tiếp tục mượn sách.')
        }
        if (card.status === 'expired') {
            throw new BadRequestException('Thẻ thư viện của bạn đã hết hạn. Vui lòng gia hạn thẻ để tiếp tục mượn sách.')
        }
        if (card.status === 'rejected' || card.status === 'pending') {
            throw new BadRequestException('Thẻ thư viện của bạn chưa được kích hoạt. Vui lòng liên hệ thủ thư.')
        }
        if (card.status !== 'active') {
            throw new BadRequestException('Thẻ thư viện không hợp lệ')
        }
        if (!card.user?.isActive) {
            throw new BadRequestException('Tài khoản của bạn đã bị khóa, không thể mượn sách')
        }

        // KIỂM TRA: Phí phạt chưa thanh toán
        const unpaidFines = await this.fineRepo.count({
            relations: { borrowRecord: { libraryCard: true } },
            where: {
                borrowRecord: { libraryCard: { userId } },
                status: 'pending'
            }
        })
        if (unpaidFines > 0) {
            throw new BadRequestException('Bạn có phí phạt chưa thanh toán. Vui lòng thanh toán trước khi gửi yêu cầu mượn sách mới.')
        }

        // KIỂM TRA: Người dùng đã đang mượn cuốn sách này chưa?
        const existingBorrow = await this.borrowRecordRepo.findOne({
            where: {
                libraryCard: { userId },
                bookCopy: { bookId },
                status: In(['borrowing', 'overdue'])
            }
        })
        if (existingBorrow) {
            throw new BadRequestException('Bạn đang mượn cuốn sách này rồi, vui lòng trả sách trước khi tạo yêu cầu mới')
        }

        // Kiểm tra xem đã có yêu cầu đang chờ cho cuốn sách này chưa
        const existing = await this.requestRepo.findOneBy({
            libraryCardId: card.id,
            bookId,
            status: 'pending'
        })
        if (existing) throw new BadRequestException('Bạn đã gửi yêu cầu mượn cuốn sách này rồi')

        const book = await this.bookRepo.findOneBy({ id: bookId })
        if (!book) throw new BadRequestException('Sách không tồn tại')
        if (book.availableCopies <= 0) throw new BadRequestException('Sách hiện không còn bản sao nào có sẵn')

        const activeReservations = await this.resRepo.count({
            where: { bookId, status: In(['waiting', 'notified']) }
        })
        if (activeReservations > 0 && book.availableCopies <= activeReservations) {
            throw new BadRequestException('Tất cả bản sao hiện đang được giữ cho người đặt trước')
        }

        // KIỂM TRA: Số sách đang mượn có vượt quá giới hạn không?
        const maxBorrow = parseInt(process.env.MAX_BORROW ?? '3', 10) || 3
        const activeBorrows = await this.borrowRecordRepo.count({
            where: {
                libraryCard: { userId },
                status: In(['borrowing', 'overdue'])
            }
        })
        if (activeBorrows >= maxBorrow) {
            throw new BadRequestException(`Bạn chỉ được mượn tối đa ${maxBorrow} cuốn cùng lúc. Hiện đang mượn ${activeBorrows} cuốn.`)
        }

        const request = this.requestRepo.create({
            libraryCardId: card.id,
            bookId,
            status: 'pending'
        })
        const saved = await this.requestRepo.save(request)
        
        // Emit realtime events
        this.realtime.emit('librarian:dashboard-update')
        this.realtime.emit('admin:dashboard-update')
        this.realtime.emit('reader:dashboard-update')
        
        return saved
    }

    async findAll() {
        return this.requestRepo.find({
            relations: { libraryCard: { user: true }, book: true },
            order: { requestedAt: 'DESC' }
        })
    }

    async findMine(userId: string) {
        const card = await this.cardRepo.findOneBy({ userId })
        if (!card) return []
        
        const requests = await this.requestRepo.find({
            where: { libraryCardId: card.id },
            relations: { book: true },
            order: { requestedAt: 'DESC' }
        })
        
        // For approved requests, attach borrow record info
        const approvedIds = requests.filter(r => r.status === 'approved').map(r => r.id)
        if (approvedIds.length > 0) {
            const records = await this.borrowRecordRepo.find({
                where: { libraryCardId: card.id },
                relations: { bookCopy: { book: true } },
                order: { createdAt: 'DESC' }
            })
            // Map borrowRecordId to borrow record
            const recordMap = new Map(records.map(r => [r.id, r]))
            for (const req of requests) {
                if (req.borrowRecordId && recordMap.has(req.borrowRecordId)) {
                    ;(req as any).borrowRecord = recordMap.get(req.borrowRecordId)
                }
            }
        }
        
        return requests
    }

    async approve(id: string, librarianId: string, copyId?: string) {
        const request = await this.requestRepo.findOne({
            where: { id },
            relations: { book: true, libraryCard: { user: true } }
        })
        if (!request || request.status !== 'pending') throw new BadRequestException('Yêu cầu không hợp lệ')
        if (!copyId) throw new BadRequestException('Vui lòng chọn mã bản sao để cấp cho độc giả')

        // KIỂM TRA: Tài khoản độc giả còn hoạt động không?
        if (!request.libraryCard?.user?.isActive) {
            throw new BadRequestException('Tài khoản độc giả đã bị khóa, không thể duyệt yêu cầu mượn')
        }

        // Tạo phiếu mượn thực tế
        const borrowRecord = await this.borrowRecordsService.borrow({
            cardId: request.libraryCardId,
            copyId: copyId
        }, librarianId)

        // Lưu borrowRecordId vào request để reader có thể tra cứu sau này
        request.borrowRecordId = borrowRecord.id
        request.status = 'approved'
        request.processedAt = new Date()
        request.processedBy = { id: librarianId } as any
        const saved = await this.requestRepo.save(request)
        
        // Fetch full borrow record details for the response
        const fullRecord = await this.borrowRecordRepo.findOne({
            where: { id: borrowRecord.id },
            relations: { bookCopy: { book: true } }
        })
        
        // Emit realtime events
        this.realtime.emit('librarian:dashboard-update')
        this.realtime.emit('reader:request-update')
        this.realtime.emit('admin:dashboard-update')
        
        return { request: saved, borrowRecord: fullRecord }
    }

    async reject(id: string, librarianId: string, reason: string) {
        const request = await this.requestRepo.findOneBy({ id })
        if (!request || request.status !== 'pending') throw new BadRequestException('Yêu cầu không hợp lệ')

        request.status = 'rejected'
        request.processedAt = new Date()
        request.processedBy = { id: librarianId } as any
        request.rejectionReason = reason
        const saved = await this.requestRepo.save(request)
        
        // Emit realtime events
        this.realtime.emit('librarian:dashboard-update')
        this.realtime.emit('reader:request-update')
        this.realtime.emit('admin:dashboard-update')
        
        return saved
    }
}
