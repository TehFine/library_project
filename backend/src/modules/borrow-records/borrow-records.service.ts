import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, DataSource, LessThan, MoreThanOrEqual } from 'typeorm'
import { BorrowRecord } from './entities/borrow-record.entity'
import { BookCopy } from '@/modules/books/entities/book-copy.entity'
import { LibraryCard } from '@/modules/library-cards/entities/library-card.entity'

@Injectable()
export class BorrowRecordsService {
    constructor(
        @InjectRepository(BorrowRecord)
        private borrowRepo: Repository<BorrowRecord>,
        @InjectRepository(BookCopy)
        private copyRepo: Repository<BookCopy>,
        @InjectRepository(LibraryCard)
        private cardRepo: Repository<LibraryCard>,
        private dataSource: DataSource,
    ) { }

    async borrow(dto: { cardId: string; copyId: string }, librarianId: string) {
        const queryRunner = this.dataSource.createQueryRunner()
        await queryRunner.connect()
        await queryRunner.startTransaction()

        try {
            const card = await this.cardRepo.findOneBy({ id: dto.cardId })
            if (card && card.status === 'active' && card.expiryDate < new Date().toISOString().split('T')[0]) {
                card.status = 'expired'
                await this.cardRepo.save(card)
            }
            if (!card || card.status !== 'active') throw new BadRequestException('Thẻ không hợp lệ, đã bị khóa hoặc hết hạn')

            const copy = await this.copyRepo.findOneBy({ id: dto.copyId })
            if (!copy || copy.status !== 'available') throw new BadRequestException('Sách không có sẵn để mượn')

            // Tạo phiếu mượn
            const now = new Date()
            const dueDate = new Date()
            dueDate.setDate(now.getDate() + 14) // Mặc định 14 ngày

            const record = this.borrowRepo.create({
                libraryCardId: card.id,
                bookCopyId: copy.id,
                librarian: { id: librarianId },
                borrowDate: now.toISOString().split('T')[0],
                dueDate: dueDate.toISOString().split('T')[0],
                status: 'borrowing'
            })

            await queryRunner.manager.save(record)

            // Cập nhật trạng thái bản sao → BookCopySubscriber tự động sync availableCopies
            copy.status = 'borrowed'
            await queryRunner.manager.save(copy)

            await queryRunner.commitTransaction()
            return record
        } catch (err) {
            await queryRunner.rollbackTransaction()
            throw err
        } finally {
            await queryRunner.release()
        }
    }

    async borrowByBookId(userId: string, bookId: string) {
        // Tìm thẻ
        const card = await this.cardRepo.findOne({
            where: { userId, status: 'active' }
        })
        if (!card) throw new BadRequestException('Bạn cần có thẻ thư viện đang hoạt động để mượn sách')

        // KIỂM TRA: User có đang mượn cuốn này không?
        const existingBorrow = await this.borrowRepo.findOne({
            where: {
                libraryCard: { userId },
                bookCopy: { bookId },
                status: 'borrowing'
            }
        })
        if (existingBorrow) {
            throw new BadRequestException('Bạn đang mượn một bản sao của cuốn sách này rồi')
        }

        // Tìm bản sao có sẵn
        const copy = await this.copyRepo.findOne({
            where: { bookId, status: 'available' }
        })
        if (!copy) throw new BadRequestException('Không còn bản sao nào có sẵn')

        // Sử dụng logic borrow có sẵn (librarianId có thể là chính user trong demo hoặc 1 ID mặc định)
        return this.borrow({ cardId: card.id, copyId: copy.id }, userId)
    }

    async returnBook(recordId: string, condition: string) {
        const queryRunner = this.dataSource.createQueryRunner()
        await queryRunner.connect()
        await queryRunner.startTransaction()

        try {
            const record = await this.borrowRepo.findOne({
                where: { id: recordId },
                relations: ['bookCopy', 'bookCopy.book']
            })
            if (!record || record.status === 'returned') throw new BadRequestException('Phiếu mượn không hợp lệ')

            const now = new Date()
            record.returnDate = now.toISOString().split('T')[0]
            record.status = 'returned'
            await queryRunner.manager.save(record)

            // Cập nhật trạng thái bản sao → BookCopySubscriber tự động sync availableCopies
            const copy = record.bookCopy
            copy.status = 'available'
            copy.condition = condition
            await queryRunner.manager.save(copy)

            await queryRunner.commitTransaction()

            // Kiểm tra quá hạn để tính phạt
            const overdue = new Date(record.returnDate) > new Date(record.dueDate)
            return { record, overdue }
        } catch (err) {
            await queryRunner.rollbackTransaction()
            throw err
        } finally {
            await queryRunner.release()
        }
    }

    async findByCopyCode(copyCode: string) {
        return this.borrowRepo.findOne({
            where: [
                { bookCopy: { copyCode }, status: 'borrowing' },
                { bookCopy: { copyCode }, status: 'overdue' }
            ],
            relations: ['bookCopy', 'bookCopy.book', 'libraryCard', 'libraryCard.user'],
            order: { createdAt: 'DESC' }
        })
    }

    async findAll() {
        return this.borrowRepo.find({
            relations: ['libraryCard', 'libraryCard.user', 'bookCopy', 'bookCopy.book'],
            order: { createdAt: 'DESC' }
        })
    }

    async findMine(userId: string, query: any) {
        const { status, page = 1, limit = 10 } = query
        const skip = (page - 1) * limit

        const today = new Date().toISOString().split('T')[0]
        let where: any = { libraryCard: { userId } }

        if (status === 'overdue') {
            where = [
                { libraryCard: { userId }, status: 'overdue' },
                { libraryCard: { userId }, status: 'borrowing', dueDate: LessThan(today) }
            ]
        } else if (status === 'borrowing') {
            where = { 
                libraryCard: { userId }, 
                status: 'borrowing', 
                dueDate: MoreThanOrEqual(today) 
            }
        } else if (status && status !== 'all') {
            where = { libraryCard: { userId }, status }
        }

        const [data, total] = await this.borrowRepo.findAndCount({
            where,
            relations: ['bookCopy', 'bookCopy.book'],
            order: { createdAt: 'DESC' },
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

    async renew(id: string, userId: string) {
        const record = await this.borrowRepo.findOne({
            where: { id },
            relations: ['libraryCard']
        })
        if (!record) throw new NotFoundException('Không tìm thấy phiếu mượn')
        
        if (record.libraryCard.userId !== userId) {
            throw new BadRequestException('Bạn không có quyền gia hạn phiếu mượn này')
        }
        
        if (record.status !== 'borrowing' && record.status !== 'overdue') {
            throw new BadRequestException('Chỉ có thể gia hạn sách đang mượn')
        }
        
        if (record.renewalCount >= 2) {
            throw new BadRequestException('Đã quá số lần gia hạn tối đa (2 lần)')
        }
        
        if (!record.originalDueDate) {
            record.originalDueDate = record.dueDate
        }
        
        const dueDate = new Date(record.dueDate)
        dueDate.setDate(dueDate.getDate() + 14) // gia hạn 14 ngày
        record.dueDate = dueDate.toISOString().split('T')[0]
        
        record.renewalCount += 1
        record.renewedAt = new Date()
        
        if (record.status === 'overdue' && dueDate > new Date()) {
            record.status = 'borrowing'
        }
        
        return this.borrowRepo.save(record)
    }
}

