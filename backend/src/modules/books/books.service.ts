import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, ILike } from 'typeorm'
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

    async findAll(params?: {
        page?: number
        limit?: number
        search?: string
        categoryId?: number
        available?: boolean
    }): Promise<{ data: Book[]; total: number; page: number; limit: number; totalPages: number }> {
        const page  = params?.page  ?? 1
        const limit = params?.limit ?? 20
        const skip  = (page - 1) * limit

        const qb = this.booksRepository.createQueryBuilder('book')
            .leftJoinAndSelect('book.category', 'category')

        let hasWhere = false

        if (params?.categoryId) {
            qb.where('book.categoryId = :categoryId', { categoryId: params.categoryId })
            hasWhere = true
        }

        if (params?.search) {
            const searchCond = '(LOWER(book.title) LIKE LOWER(:search) OR LOWER(book.author) LIKE LOWER(:search))'
            if (hasWhere) {
                qb.andWhere(searchCond, { search: `%${params.search}%` })
            } else {
                qb.where(searchCond, { search: `%${params.search}%` })
                hasWhere = true
            }
        }

        if (params?.available) {
            if (hasWhere) {
                qb.andWhere('book.availableCopies > 0')
            } else {
                qb.where('book.availableCopies > 0')
                hasWhere = true
            }
        }

        const [data, total] = await qb
            .orderBy('book.createdAt', 'ASC')
            .skip(skip)
            .take(limit)
            .getManyAndCount()

        const totalPages = Math.ceil(total / limit)
        return { data, total, page, limit, totalPages }
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
        const saved = await this.booksRepository.save(book)
        return saved as unknown as Book
    }

    async update(id: string, dto: any): Promise<Book> {
        const book = await this.findOne(id)
        
        // Remove nested fields if they exist in dto but shouldn't be updated directly via this method
        const updateData = { ...dto }
        delete updateData.copies
        delete updateData.createdBy
        
        // If categoryId is provided, we can either set the relation or the ID
        if (updateData.categoryId) {
            updateData.category = { id: updateData.categoryId }
            delete updateData.categoryId
        }

        Object.assign(book, updateData)
        const saved = await this.booksRepository.save(book)
        return saved as unknown as Book
    }

    async createCopy(bookId: string, dto: any): Promise<BookCopy> {
        const book = await this.findOne(bookId)
        const copy = this.bookCopiesRepository.create({
            ...dto,
            book
        })
        
        const savedCopy = await this.bookCopiesRepository.save(copy)
        await this.updateCopyCounts(bookId)
        return savedCopy as unknown as BookCopy
    }

    async updateCopy(copyId: string, dto: any): Promise<BookCopy> {
        const copy = await this.bookCopiesRepository.findOne({ 
            where: { id: copyId }, 
            relations: ['book'] 
        })
        if (!copy) throw new NotFoundException('Không tìm thấy bản sao sách')
        
        if (copy.status === 'borrowed' && dto.status && dto.status !== 'borrowed') {
            throw new Error('Không thể thay đổi trạng thái của sách đang được mượn')
        }

        Object.assign(copy, dto)
        const savedCopy = await this.bookCopiesRepository.save(copy)
        
        if (copy.book) {
            await this.updateCopyCounts(copy.book.id)
        }
        
        return savedCopy as unknown as BookCopy
    }

    async removeCopy(copyId: string): Promise<{ success: boolean }> {
        const copy = await this.bookCopiesRepository.findOne({ 
            where: { id: copyId }, 
            relations: ['book'] 
        })
        if (!copy) throw new NotFoundException('Không tìm thấy bản sao sách')
        
        if (copy.status === 'borrowed') {
            throw new Error('Không thể xóa bản sao đang được mượn')
        }

        const bookId = copy.book?.id
        await this.bookCopiesRepository.remove(copy)
        
        if (bookId) {
            await this.updateCopyCounts(bookId)
        }
        
        return { success: true }
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

    async findCopyByCode(copyCode: string) {
        const copy = await this.bookCopiesRepository.findOne({
            where: { copyCode },
            relations: ['book']
        })
        if (!copy) throw new NotFoundException('Không tìm thấy bản sao sách')
        return copy
    }

    async searchCopies(q: string) {
        return this.bookCopiesRepository.find({
            where: [
                { copyCode: ILike(`%${q}%`) },
                { book: { title: ILike(`%${q}%`) } }
            ],
            relations: ['book'],
            take: 20
        })
    }
}

