import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BorrowRequest } from './entities/borrow-request.entity'
import { LibraryCard } from '../library-cards/entities/library-card.entity'
import { Book } from '../books/entities/book.entity'
import { BorrowRecord } from '../borrow-records/entities/borrow-record.entity'
import { BorrowRecordsService } from '../borrow-records/borrow-records.service'
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
        private borrowRecordsService: BorrowRecordsService,
        private realtime: RealtimeGateway,
    ) { }

    async create(userId: string, bookId: string) {
        const card = await this.cardRepo.findOneBy({ userId, status: 'active' })
        if (!card) throw new BadRequestException('Bạn cần có thẻ thư viện đang hoạt động')

        // Kiểm tra xem đã có yêu cầu đang chờ cho cuốn sách này chưa
        const existing = await this.requestRepo.findOneBy({
            libraryCardId: card.id,
            bookId,
            status: 'pending'
        })
        if (existing) throw new BadRequestException('Bạn đã gửi yêu cầu mượn cuốn sách này rồi')

        const book = await this.bookRepo.findOneBy({ id: bookId })
        if (!book || book.availableCopies <= 0) throw new BadRequestException('Sách hiện không còn bản sao nào có sẵn')

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
            relations: { book: true, libraryCard: true }
        })
        if (!request || request.status !== 'pending') throw new BadRequestException('Yêu cầu không hợp lệ')
        if (!copyId) throw new BadRequestException('Vui lòng chọn mã bản sao để cấp cho độc giả')

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
