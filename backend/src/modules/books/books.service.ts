import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Book } from './entities/book.entity'
import { BookCopy } from './entities/book-copy.entity'

@Injectable()
export class BooksService {
    constructor(
        @InjectRepository(Book)
        private booksRepository: Repository<Book>,
        @InjectRepository(BookCopy)
        private bookCopiesRepository: Repository<BookCopy>,
    ) { }

    async findAll(): Promise<Book[]> {
        return this.booksRepository.find({ relations: ['category'] })
    }

    async findOne(id: string): Promise<Book> {
        const book = await this.booksRepository.findOne({
            where: { id },
            relations: ['category', 'copies']
        })
        if (!book) throw new NotFoundException('Book not found')
        return book
    }

    async create(dto: any, userId: string): Promise<Book> {
        const book = this.booksRepository.create({
            ...dto,
            createdBy: { id: userId }
        })
        return this.booksRepository.save(book)
    }

    async createCopy(bookId: string, dto: any): Promise<BookCopy> {
        const book = await this.findOne(bookId)
        const copy = this.bookCopiesRepository.create({
            ...dto,
            book
        })
        
        const savedCopy = await this.bookCopiesRepository.save(copy)
        
        // Cập nhật số lượng sách
        await this.updateCopyCounts(bookId)
        
        return savedCopy
    }

    private async updateCopyCounts(bookId: string) {
        const copies = await this.bookCopiesRepository.find({ where: { bookId } })
        const total = copies.length
        const available = copies.filter(c => c.status === 'available').length
        
        await this.booksRepository.update(bookId, {
            totalCopies: total,
            availableCopies: available
        })
    }
}
