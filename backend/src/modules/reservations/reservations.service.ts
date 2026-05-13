import { Injectable, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Reservation } from './entities/reservation.entity'
import { Book } from '@/modules/books/entities/book.entity'
import { LibraryCardsService } from '@/modules/library-cards/library-cards.service'
import { SEED_IDS } from '@/common/database/seeds/mock-db'

@Injectable()
export class ReservationsService {
    constructor(
        @InjectRepository(Reservation)
        private resRepo: Repository<Reservation>,
        @InjectRepository(Book)
        private bookRepo: Repository<Book>,
        private cardService: LibraryCardsService,
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

        return this.resRepo.save(reservation)
    }

    async findAll() {
        return this.resRepo.find({
            relations: ['libraryCard', 'libraryCard.user', 'book'],
            order: { reservedAt: 'ASC' }
        })
    }

    async cancel(id: string) {
        const res = await this.resRepo.findOneBy({ id })
        if (!res) throw new BadRequestException('Không tìm thấy yêu cầu đặt trước')
        
        res.status = 'cancelled'
        return this.resRepo.save(res)
    }

    async findMine(userId: string, query: any) {
        const { page = 1, limit = 10 } = query
        const skip = (page - 1) * limit

        const [data, total] = await this.resRepo.findAndCount({
            where: {
                libraryCard: { userId }
            },
            relations: ['book'],
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

