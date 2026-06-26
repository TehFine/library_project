import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, ILike } from 'typeorm'
import { Book } from './entities/book.entity'
import { BookCopy } from './entities/book-copy.entity'
import { RealtimeGateway } from '@/common/websocket/realtime.gateway'

@Injectable()
export class BooksService {
    constructor(
        @InjectRepository(Book)
        private booksRepository: Repository<Book>,
        @InjectRepository(BookCopy)
        private bookCopiesRepository: Repository<BookCopy>,
        private realtime: RealtimeGateway,
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
            relations: { category: true, copies: true }
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
        this.realtime.emit('admin:dashboard-update')
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
        this.realtime.emit('admin:dashboard-update')
        return saved as unknown as Book
    }

    async createCopy(bookId: string, dto: any): Promise<BookCopy> {
        const book = await this.findOne(bookId)
        const copy = this.bookCopiesRepository.create({
            ...dto,
            book
        })
        // BookCopySubscriber tự động cập nhật totalCopies và availableCopies
        const saved = await this.bookCopiesRepository.save(copy)
        this.realtime.emit('admin:dashboard-update')
        return saved as unknown as BookCopy
    }

    async updateCopy(copyId: string, dto: any): Promise<BookCopy> {
        const copy = await this.bookCopiesRepository.findOne({ 
            where: { id: copyId }
        })
        if (!copy) throw new NotFoundException('Không tìm thấy bản sao sách')
        
        if ((copy.status === 'borrowed' || copy.status === 'reserved') && dto.status && dto.status !== copy.status) {
            throw new BadRequestException('Không thể thay đổi trạng thái của sách đang được mượn hoặc đã được đặt trước')
        }

        Object.assign(copy, dto)
        // BookCopySubscriber tự động cập nhật totalCopies và availableCopies
        const saved = await this.bookCopiesRepository.save(copy)
        this.realtime.emit('admin:dashboard-update')
        return saved as unknown as BookCopy
    }

    async removeCopy(copyId: string): Promise<{ success: boolean }> {
        const copy = await this.bookCopiesRepository.findOne({ 
            where: { id: copyId }
        })
        if (!copy) throw new NotFoundException('Không tìm thấy bản sao sách')
        
        if (copy.status === 'borrowed' || copy.status === 'reserved') {
            throw new BadRequestException('Không thể xóa bản sao đang được mượn hoặc đã được đặt trước')
        }

        // BookCopySubscriber tự động cập nhật totalCopies và availableCopies
        await this.bookCopiesRepository.remove(copy)
        this.realtime.emit('admin:dashboard-update')
        return { success: true }
    }

    async findCopyByCode(copyCode: string) {
        const copy = await this.bookCopiesRepository.findOne({
            where: { copyCode },
            relations: { book: true }
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
            relations: { book: true },
            take: 20
        })
    }

    async getAvailableCopies(bookId: string) {
        const book = await this.booksRepository.findOne({
            where: { id: bookId },
            relations: { category: true }
        })
        if (!book) throw new NotFoundException('Không tìm thấy sách')

        const copies = await this.bookCopiesRepository.find({
            where: { bookId, status: 'available' },
            order: { copyCode: 'ASC' }
        })

        return {
            book,
            availableCopies: copies
        }
    }
}

