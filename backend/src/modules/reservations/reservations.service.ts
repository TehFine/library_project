import { Injectable, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Reservation } from './entities/reservation.entity'
import { Book } from '@/modules/books/entities/book.entity'

@Injectable()
export class ReservationsService {
    constructor(
        @InjectRepository(Reservation)
        private resRepo: Repository<Reservation>,
        @InjectRepository(Book)
        private bookRepo: Repository<Book>,
    ) { }

    async create(cardId: string, bookId: string) {
        const book = await this.bookRepo.findOneBy({ id: bookId })
        if (!book) throw new BadRequestException('Sách không tồn tại')

        // Kiểm tra xem sách có thực sự hết bản sao không
        if (book.availableCopies > 0) {
            throw new BadRequestException('Vẫn còn sách có sẵn, không cần đặt trước')
        }

        // Tính toán vị trí trong hàng đợi
        const count = await this.resRepo.count({
            where: { bookId, status: 'waiting' }
        })

        const reservation = this.resRepo.create({
            libraryCardId: cardId,
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
}
