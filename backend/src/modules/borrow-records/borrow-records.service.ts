import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, DataSource, LessThan } from 'typeorm'
import { BorrowRecord } from './entities/borrow-record.entity'
import { BookCopy } from '@/modules/books/entities/book-copy.entity'
import { LibraryCard } from '@/modules/library-cards/entities/library-card.entity'
import { Book } from '@/modules/books/entities/book.entity'
import { Reservation } from '@/modules/reservations/entities/reservation.entity'
import { BorrowRequest } from '@/modules/borrow-requests/entities/borrow-request.entity'
import { Fine } from '@/modules/fines/entities/fine.entity'
import { RealtimeGateway } from '@/common/websocket/realtime.gateway'

@Injectable()
export class BorrowRecordsService {
    constructor(
        @InjectRepository(BorrowRecord)
        private borrowRepo: Repository<BorrowRecord>,
        @InjectRepository(BookCopy)
        private copyRepo: Repository<BookCopy>,
        @InjectRepository(LibraryCard)
        private cardRepo: Repository<LibraryCard>,
        @InjectRepository(Book)
        private bookRepo: Repository<Book>,
        @InjectRepository(Reservation)
        private resRepo: Repository<Reservation>,
        @InjectRepository(Fine)
        private fineRepo: Repository<Fine>,
        private dataSource: DataSource,
        private realtime: RealtimeGateway,
    ) { }

    async borrow(dto: { cardId: string; copyId: string; requestId?: string }, librarianId: string, isReservation: boolean = false) {
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

            const copy = await this.copyRepo.findOne({
                where: { id: dto.copyId }
            })
            if (!copy) throw new BadRequestException('Bản sao không tồn tại')
            
            if (isReservation) {
                if (copy.status !== 'reserved') throw new BadRequestException('Bản sao này chưa được giữ cho đặt trước')
            } else {
                if (copy.status !== 'available') throw new BadRequestException('Sách không có sẵn để mượn')
            }

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

            // Cập nhật trạng thái bản sao (Subscriber sẽ tự cập nhật availableCopies)
            copy.status = 'borrowed'
            await queryRunner.manager.save(copy)

            await queryRunner.commitTransaction()
            
            // Nếu có requestId, cập nhật trạng thái yêu cầu mượn thành 'approved'
            if (dto.requestId) {
                try {
                    await this.approveBorrowRequest(dto.requestId, record.id, librarianId)
                } catch (err) {
                    // Không throw lỗi — phiếu mượn đã tạo thành công
                    console.error('Failed to approve borrow request:', err.message)
                }
            }

            // Emit realtime events
            this.realtime.emit('librarian:dashboard-update')
            this.realtime.emit('admin:dashboard-update')
            this.realtime.emit('reader:dashboard-update')
            
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

        // Sử dụng logic borrow có sẵn
        return this.borrow({ cardId: card.id, copyId: copy.id }, userId)
    }

    async returnBook(recordId: string, condition: string) {
        const queryRunner = this.dataSource.createQueryRunner()
        await queryRunner.connect()
        await queryRunner.startTransaction()

        try {
            const record = await this.borrowRepo.findOne({
                where: { id: recordId },
                relations: { bookCopy: { book: true } }
            })
            if (!record || record.status === 'returned') throw new BadRequestException('Phiếu mượn không hợp lệ')

            const now = new Date()
            record.returnDate = now.toISOString().split('T')[0]
            record.status = 'returned'
            await queryRunner.manager.save(record)

            const copy = record.bookCopy
            const book = copy.book

            // Check if there are any waiting reservations for this book
            const oldestReservation = await queryRunner.manager.findOne(Reservation, {
                where: { bookId: book.id, status: 'waiting' },
                order: { reservedAt: 'ASC' }
            })

            if (oldestReservation) {
                // Fulfill reservation
                oldestReservation.status = 'notified'
                oldestReservation.notifiedAt = new Date()
                
                const expiresAt = new Date()
                expiresAt.setHours(expiresAt.getHours() + 48) // 48 hours deadline
                oldestReservation.expiresAt = expiresAt
                
                oldestReservation.reservedCopyId = copy.id
                await queryRunner.manager.save(oldestReservation)

                // Copy goes to reserved
                copy.status = 'reserved'
                copy.condition = condition
                await queryRunner.manager.save(copy)
            } else {
                copy.status = 'available'
                copy.condition = condition
                await queryRunner.manager.save(copy)
            }

            await queryRunner.commitTransaction()
            
            // Emit realtime events
            this.realtime.emit('librarian:dashboard-update')
            this.realtime.emit('admin:dashboard-update')
            this.realtime.emit('reader:dashboard-update')
            
            // Kiểm tra quá hạn để tính phạt
            const overdue = new Date(record.returnDate) > new Date(record.dueDate)
            
            // Tự động tạo/cập nhật phí phạt nếu quá hạn
            if (overdue) {
                const dueDate = new Date(record.dueDate)
                const returnDate = new Date(record.returnDate)
                const diffTime = returnDate.getTime() - dueDate.getTime()
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

                let amount: number
                if (diffDays <= 5) {
                    amount = diffDays * 1000
                } else {
                    amount = 5000 + (diffDays - 5) * 3000
                }

                const existingFine = await this.fineRepo.findOneBy({ borrowRecordId: record.id })
                if (existingFine) {
                    // Cập nhật số ngày & số tiền theo thời điểm trả thực tế
                    existingFine.overdueDays = diffDays
                    existingFine.amount = amount
                    await this.fineRepo.save(existingFine)
                } else {
                    const fine = this.fineRepo.create({
                        borrowRecordId: record.id,
                        fineType: 'overdue',
                        overdueDays: diffDays,
                        amount,
                        status: 'pending',
                    })
                    await this.fineRepo.save(fine)
                }
            }
            
            return { record, overdue }
        } catch (err) {
            await queryRunner.rollbackTransaction()
            throw err
        } finally {
            await queryRunner.release()
        }
    }

    private async approveBorrowRequest(requestId: string, borrowRecordId: string, librarianId: string) {
        const requestRepo = this.dataSource.manager.getRepository(BorrowRequest)
        const request = await requestRepo.findOneBy({ id: requestId })
        if (!request || request.status !== 'pending') {
            throw new BadRequestException('Yêu cầu mượn không hợp lệ hoặc đã được xử lý')
        }
        request.status = 'approved'
        request.borrowRecordId = borrowRecordId
        request.processedAt = new Date()
        request.processedBy = { id: librarianId } as any
        await requestRepo.save(request)

        this.realtime.emit('reader:request-update')
    }

    async findByCopyCode(copyCode: string) {
        return this.borrowRepo.findOne({
            where: [
                { bookCopy: { copyCode }, status: 'borrowing' },
                { bookCopy: { copyCode }, status: 'overdue' }
            ],
            relations: { bookCopy: { book: true }, libraryCard: { user: true } },
            order: { createdAt: 'DESC' }
        })
    }

    async findAll() {
        return this.borrowRepo.find({
            relations: { libraryCard: { user: true }, bookCopy: { book: true } },
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
                status: 'borrowing'
            }
        } else if (status && status !== 'all') {
            where = { libraryCard: { userId }, status }
        }

        const [data, total] = await this.borrowRepo.findAndCount({
            where,
            relations: { bookCopy: { book: true } },
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

    async findByCardNumber(cardNumber: string) {
        return this.borrowRepo.find({
            where: { libraryCard: { cardNumber } },
            relations: { bookCopy: { book: true }, libraryCard: { user: { profile: true } } },
            order: { createdAt: 'DESC' },
            take: 20
        });
    }

    async searchByBookTitle(q: string) {
        // Tìm tất cả phiếu mượn đang active, join với book để search theo title
        const records = await this.borrowRepo.find({
            where: [
                { status: 'borrowing' },
                { status: 'overdue' },
            ],
            relations: { bookCopy: { book: true }, libraryCard: { user: { profile: true } } },
            order: { createdAt: 'DESC' }
        })

        // Lọc theo tên sách (client-side vì TypeORM không dễ join deep)
        if (!q) return records.slice(0, 20)
        const lower = q.toLowerCase()
        return records.filter(r =>
            r.bookCopy?.book?.title?.toLowerCase().includes(lower) ||
            r.bookCopy?.copyCode?.toLowerCase().includes(lower)
        ).slice(0, 20)
    }

    async findPendingReturns() {
        return this.borrowRepo.find({
            where: { returnRequested: true, status: 'borrowing' },
            relations: { bookCopy: { book: true }, libraryCard: { user: { profile: true } } },
            order: { createdAt: 'DESC' }
        });
    }

    async requestReturn(recordId: string, userId: string) {
        const record = await this.borrowRepo.findOne({
            where: { id: recordId },
            relations: { libraryCard: true }
        })
        if (!record) throw new NotFoundException('Không tìm thấy phiếu mượn')
        if (record.libraryCard.userId !== userId) {
            throw new BadRequestException('Bạn không có quyền yêu cầu trả phiếu mượn này')
        }
        if (record.status === 'returned') {
            throw new BadRequestException('Phiếu mượn này đã được trả rồi')
        }
        if (record.returnRequested) {
            throw new BadRequestException('Bạn đã yêu cầu trả sách này rồi, vui lòng chờ thủ thư xác nhận')
        }

        record.returnRequested = true
        const saved = await this.borrowRepo.save(record)

        // Emit realtime events
        this.realtime.emit('librarian:dashboard-update')
        this.realtime.emit('reader:dashboard-update')

        return saved
    }

    async approveReturn(recordId: string, librarianId: string, condition: string) {
        const record = await this.borrowRepo.findOne({
            where: { id: recordId },
            relations: { libraryCard: true }
        })
        if (!record) throw new NotFoundException('Không tìm thấy phiếu mượn')
        if (!record.returnRequested) {
            throw new BadRequestException('Độc giả chưa yêu cầu trả sách này')
        }
        if (record.status === 'returned') {
            throw new BadRequestException('Phiếu mượn này đã được trả rồi')
        }

        // Xóa cờ yêu cầu trả trước khi gọi returnBook
        record.returnRequested = false
        await this.borrowRepo.save(record)

        // Gọi logic trả sách có sẵn (cập nhật trạng thái bản sao, xử lý reservation...)
        return this.returnBook(recordId, condition)
    }

    async simulateReturn(recordId: string, userId: string) {
        const record = await this.borrowRepo.findOne({
            where: { id: recordId },
            relations: { libraryCard: true, bookCopy: { book: true } }
        })
        if (!record) throw new NotFoundException('Không tìm thấy phiếu mượn')
        if (record.libraryCard.userId !== userId) {
            throw new BadRequestException('Bạn không có quyền trả phiếu mượn này')
        }
        if (record.status === 'returned') {
            throw new BadRequestException('Phiếu mượn này đã được trả rồi')
        }

        // Gọi logic trả sách giống librarian, mặc định condition là 'good'
        const result = await this.returnBook(recordId, 'good')
        
        // Emit thêm reader event
        this.realtime.emit('reader:dashboard-update')
        
        return {
            ...result,
            simulated: true,
            message: 'Trả sách thành công (Mô phỏng)'
        }
    }

    async renew(id: string, userId: string) {
        const record = await this.borrowRepo.findOne({
            where: { id },
            relations: { libraryCard: true }
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
