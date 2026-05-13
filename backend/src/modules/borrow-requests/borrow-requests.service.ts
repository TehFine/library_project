import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BorrowRequest } from './entities/borrow-request.entity'
import { LibraryCard } from '../library-cards/entities/library-card.entity'
import { Book } from '../books/entities/book.entity'
import { BorrowRecordsService } from '../borrow-records/borrow-records.service'

@Injectable()
export class BorrowRequestsService {
    constructor(
        @InjectRepository(BorrowRequest)
        private requestRepo: Repository<BorrowRequest>,
        @InjectRepository(LibraryCard)
        private cardRepo: Repository<LibraryCard>,
        @InjectRepository(Book)
        private bookRepo: Repository<Book>,
        private borrowRecordsService: BorrowRecordsService,
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
        return this.requestRepo.save(request)
    }

    async findAll() {
        return this.requestRepo.find({
            relations: ['libraryCard', 'libraryCard.user', 'book'],
            order: { requestedAt: 'DESC' }
        })
    }

    async findMine(userId: string) {
        const card = await this.cardRepo.findOneBy({ userId })
        if (!card) return []
        return this.requestRepo.find({
            where: { libraryCardId: card.id },
            relations: ['book'],
            order: { requestedAt: 'DESC' }
        })
    }

    async approve(id: string, librarianId: string, copyId?: string) {
        const request = await this.requestRepo.findOne({
            where: { id },
            relations: ['book', 'libraryCard']
        })
        if (!request || request.status !== 'pending') throw new BadRequestException('Yêu cầu không hợp lệ')

        // Khi duyệt, ta cần chọn 1 bản sao cụ thể (nếu chưa chọn)
        // Nếu librarian không truyền copyId, ta tự tìm 1 bản có sẵn
        // Nhưng thường librarian sẽ chọn bản sao cụ thể khi duyệt
        
        // Chuyển thành phiếu mượn thật
        // Lưu ý: borrowRecordsService.borrow cần copyId
        // Ta có thể tìm 1 bản sao có sẵn của sách đó
        
        // Cần truyền copyId từ controller (librarian chọn)
        if (!copyId) throw new BadRequestException('Vui lòng chọn mã bản sao để cấp cho độc giả')

        await this.borrowRecordsService.borrow({
            cardId: request.libraryCardId,
            copyId: copyId
        }, librarianId)

        request.status = 'approved'
        request.processedAt = new Date()
        request.processedBy = { id: librarianId } as any
        return this.requestRepo.save(request)
    }

    async reject(id: string, librarianId: string, reason: string) {
        const request = await this.requestRepo.findOneBy({ id })
        if (!request || request.status !== 'pending') throw new BadRequestException('Yêu cầu không hợp lệ')

        request.status = 'rejected'
        request.processedAt = new Date()
        request.processedBy = { id: librarianId } as any
        request.rejectionReason = reason
        return this.requestRepo.save(request)
    }
}
