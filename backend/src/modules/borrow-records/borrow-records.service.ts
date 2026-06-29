import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { toLocalDateStr } from '@/common/utils/date'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, DataSource, LessThan, In } from 'typeorm'
import { BorrowRecord } from './entities/borrow-record.entity'
import { BookCopy } from '@/modules/books/entities/book-copy.entity'
import { LibraryCard } from '@/modules/library-cards/entities/library-card.entity'
import { Book } from '@/modules/books/entities/book.entity'
import { Reservation } from '@/modules/reservations/entities/reservation.entity'
import { BorrowRequest } from '@/modules/borrow-requests/entities/borrow-request.entity'
import { Fine } from '@/modules/fines/entities/fine.entity'
import { Notification } from '@/modules/notifications/entities/notification.entity'
import { SystemConfig } from '@/modules/admin/entities/system-config.entity'
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
        @InjectRepository(SystemConfig)
        private configRepo: Repository<SystemConfig>,
        @InjectRepository(Notification)
        private notifRepo: Repository<Notification>,
        private dataSource: DataSource,
        private realtime: RealtimeGateway,
    ) { }

    private async getFineRates(): Promise<{ first5: number; fromDay6: number }> {
        const defaults = { first5: 1000, fromDay6: 3000 }
        try {
            const configs = await this.configRepo.find({
                where: [
                    { key: 'fine_first_5_days' },
                    { key: 'fine_from_day_6' },
                ]
            })
            const map = new Map(configs.map(c => [c.key, c.value]))
            return {
                first5: parseInt(map.get('fine_first_5_days') ?? '', 10) || defaults.first5,
                fromDay6: parseInt(map.get('fine_from_day_6') ?? '', 10) || defaults.fromDay6,
            }
        } catch {
            return defaults
        }
    }

    async borrow(dto: { cardId: string; copyId: string; requestId?: string }, librarianId: string, isReservation: boolean = false) {
        const queryRunner = this.dataSource.createQueryRunner()
        await queryRunner.connect()
        await queryRunner.startTransaction()

        try {
            const card = await this.cardRepo.findOne({
                where: { id: dto.cardId },
                relations: { user: true }
            })
            if (card && card.status === 'active' && card.expiryDate < toLocalDateStr()) {
                card.status = 'expired'
                await this.cardRepo.save(card)
            }
            if (!card || card.status !== 'active') throw new BadRequestException('Thẻ không hợp lệ, đã bị khóa hoặc hết hạn')

            // KIỂM TRA: Tài khoản độc giả còn hoạt động không?
            if (!card.user?.isActive) {
                throw new BadRequestException('Tài khoản độc giả đã bị khóa, không thể tạo phiếu mượn mới')
            }

            const copy = await this.copyRepo.findOne({
                where: { id: dto.copyId }
            })
            if (!copy) throw new BadRequestException('Bản sao không tồn tại')
            
            if (isReservation) {
                if (copy.status !== 'reserved') throw new BadRequestException('Bản sao này chưa được giữ cho đặt trước')
            } else {
                if (copy.status !== 'available') throw new BadRequestException('Sách không có sẵn để mượn')
            }

            // KIỂM TRA: Người dùng đã mượn cuốn sách này chưa?
            const existingBorrow = await this.borrowRepo.findOne({
                where: {
                    libraryCard: { userId: card.userId },
                    bookCopy: { bookId: copy.bookId },
                    status: In(['borrowing', 'overdue'])
                }
            })
            if (existingBorrow) {
                throw new BadRequestException('Độc giả này đang mượn cuốn sách này rồi, vui lòng trả sách trước khi mượn lại')
            }

            // KIỂM TRA: Có phí phạt chưa thanh toán không?
            const unpaidFines = await this.fineRepo.count({
                relations: { borrowRecord: { libraryCard: true } },
                where: {
                    borrowRecord: { libraryCard: { userId: card.userId } },
                    status: 'pending'
                }
            })
            if (unpaidFines > 0) {
                throw new BadRequestException('Bạn có phí phạt chưa thanh toán. Vui lòng thanh toán trước khi mượn sách mới.')
            }

            // KIỂM TRA: Số sách đang mượn có vượt quá giới hạn không?
            const maxBorrow = parseInt(process.env.MAX_BORROW ?? '3', 10) || 3
            const activeBorrows = await this.borrowRepo.count({
                where: {
                    libraryCard: { userId: card.userId },
                    status: In(['borrowing', 'overdue'])
                }
            })
            if (activeBorrows >= maxBorrow) {
                throw new BadRequestException(`Độc giả chỉ được mượn tối đa ${maxBorrow} cuốn cùng lúc. Hiện đang mượn ${activeBorrows} cuốn.`)
            }

            // Tạo phiếu mượn
            const now = new Date()
            const dueDate = new Date()
            dueDate.setDate(now.getDate() + 14) // Mặc định 14 ngày

            const record = this.borrowRepo.create({
                libraryCardId: card.id,
                bookCopyId: copy.id,
                librarian: { id: librarianId },
                borrowDate: toLocalDateStr(now),
                dueDate: toLocalDateStr(dueDate),
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
                status: In(['borrowing', 'overdue'])
            }
        })
        if (existingBorrow) {
            throw new BadRequestException('Bạn đang mượn cuốn sách này rồi, vui lòng trả sách trước khi mượn lại')
        }

        // Tìm bản sao có sẵn
        const copy = await this.copyRepo.findOne({
            where: { bookId, status: 'available' }
        })
        if (!copy) throw new BadRequestException('Không còn bản sao nào có sẵn')

        // Sử dụng logic borrow có sẵn
        return this.borrow({ cardId: card.id, copyId: copy.id }, userId)
    }

    async returnBook(recordId: string, condition: string, paymentMethod?: string, librarianId?: string) {
        const queryRunner = this.dataSource.createQueryRunner()
        await queryRunner.connect()
        await queryRunner.startTransaction()

        try {
            const record = await this.borrowRepo.findOne({
                where: { id: recordId },
                relations: { bookCopy: { book: true }, libraryCard: { user: true } }
            })
            if (!record || record.status === 'returned') throw new BadRequestException('Phiếu mượn không hợp lệ')

            const now = new Date()
            record.returnDate = toLocalDateStr(now)
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

            // Kiểm tra quá hạn để tính phạt
            const dueDate = new Date(record.dueDate)
            const returnDate = new Date(record.returnDate)
            dueDate.setHours(0, 0, 0, 0)
            returnDate.setHours(0, 0, 0, 0)
            const diffTime = returnDate.getTime() - dueDate.getTime()
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
            const overdue = diffDays > 0

            // Tự động tạo/cập nhật phí phạt nếu quá hạn (trong transaction)
            const rates = await this.getFineRates()
            let fineAmount = 0
            if (overdue) {
                let amount: number
                if (diffDays <= 5) {
                    amount = diffDays * rates.first5
                } else {
                    amount = 5 * rates.first5 + (diffDays - 5) * rates.fromDay6
                }
                fineAmount = amount

                const existingFine = await queryRunner.manager.findOne(Fine, {
                    where: { borrowRecordId: record.id }
                })
                if (existingFine) {
                    existingFine.overdueDays = diffDays
                    existingFine.amount = amount
                    // Nếu có paymentMethod, đánh dấu đã thu ngay
                    if (paymentMethod && librarianId) {
                        existingFine.status = 'paid'
                        existingFine.paidAt = new Date()
                        existingFine.paymentMethod = paymentMethod
                        existingFine.receiptNumber = `REC-${Date.now()}`
                        existingFine.collectedBy = { id: librarianId } as any
                    }
                    await queryRunner.manager.save(existingFine)
                } else {
                    const fineData: any = {
                        borrowRecordId: record.id,
                        fineType: 'overdue',
                        overdueDays: diffDays,
                        amount,
                        status: paymentMethod && librarianId ? 'paid' : 'pending',
                    }
                    if (paymentMethod && librarianId) {
                        fineData.paidAt = new Date()
                        fineData.paymentMethod = paymentMethod
                        fineData.receiptNumber = `REC-${Date.now()}`
                        fineData.collectedBy = { id: librarianId } as any
                    }
                    const fine = queryRunner.manager.create(Fine, fineData)
                    await queryRunner.manager.save(fine)
                }

                // Nếu fine được tạo/cập nhật mà KHÔNG thu tiền (status='pending'),
                // khóa thẻ thư viện để không cho mượn tiếp
                const fineStatus = paymentMethod && librarianId ? 'paid' : 'pending'
                if (fineStatus === 'pending') {
                    const card = await queryRunner.manager.findOne(LibraryCard, {
                        where: { userId: record.libraryCard.userId }
                    })
                    if (card && card.status === 'active') {
                        card.status = 'locked'
                        await queryRunner.manager.save(card)
                    }
                }
            }

            await queryRunner.commitTransaction()

            // Gửi thông báo realtime cho độc giả nếu có reservation được kích hoạt
            if (oldestReservation) {
                try {
                    const resWithUser = await this.resRepo.findOne({
                        where: { id: oldestReservation.id },
                        relations: { libraryCard: { user: { profile: true } }, book: true },
                    })
                    if (resWithUser?.libraryCard?.user?.id) {
                        const userId = resWithUser.libraryCard.user.id
                        const bookTitle = book?.title || 'sách'
                        const expiresTimeStr = oldestReservation.expiresAt?.toLocaleDateString('vi-VN', {
                            hour: '2-digit', minute: '2-digit',
                            day: '2-digit', month: '2-digit',
                        }) || 'trong 48h'

                        const notification = this.notifRepo.create({
                            notificationType: 'individual',
                            title: '📖 Sách đã sẵn sàng!',
                            content: `Sách "${bookTitle}" đã có sẵn cho bạn! Vui lòng đến thư viện mượn sách trước ${expiresTimeStr} (48h).`,
                            userId,
                            read: false,
                            status: 'sent',
                            sentAt: new Date(),
                            createdById: userId,
                        })
                        await this.notifRepo.save(notification)

                        this.realtime.emitToUser(userId, 'reader:notification', {
                            id: notification.id,
                            title: notification.title,
                            content: `📖 Sách "${bookTitle}" đã sẵn sàng! Đến thư viện mượn ngay.`,
                            createdAt: notification.createdAt,
                        })
                    }
                } catch (notifErr) {
                    console.error('Lỗi gửi thông báo reservation khi trả sách:', notifErr)
                }
            }

            // Emit realtime events (sau khi đã tạo fine)
            this.realtime.emit('librarian:dashboard-update')
            this.realtime.emit('admin:dashboard-update')
            this.realtime.emit('reader:dashboard-update')

            return { record, overdue, fineAmount }
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
        const { status, page = 1, limit = 12 } = query
        const skip = (page - 1) * limit

        const today = toLocalDateStr()
        let where: any = { libraryCard: { userId } }

        if (status === 'overdue') {
            where = [
                { libraryCard: { userId }, status: 'overdue' },
                { libraryCard: { userId }, status: 'borrowing', dueDate: LessThan(today) }
            ]
        } else if (status === 'borrowing') {
            // Bao gồm cả 'borrowing' và 'overdue' vì độc giả vẫn đang giữ sách
            where = [
                { libraryCard: { userId }, status: 'borrowing' },
                { libraryCard: { userId }, status: 'overdue' }
            ]
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
            where: { returnRequested: true, status: In(['borrowing', 'overdue']) },
            relations: { bookCopy: { book: true }, libraryCard: { user: { profile: true } } },
            order: { returnRequestedAt: 'ASC' }
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
        record.returnRequestedAt = new Date()
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

        // Gọi returnBook trước (có transaction riêng) để đảm bảo trả sách thành công
        const result = await this.returnBook(recordId, condition, undefined, librarianId)

        // Sau đó xóa cờ yêu cầu trả
        record.returnRequested = false
        record.returnRequestedAt = null
        await this.borrowRepo.save(record)

        return result
    }

    async snoozeReturnRequest(recordId: string, librarianId: string) {
        const record = await this.borrowRepo.findOne({
            where: { id: recordId }
        })
        if (!record) throw new NotFoundException('Không tìm thấy phiếu mượn')
        if (!record.returnRequested) {
            throw new BadRequestException('Độc giả chưa yêu cầu trả sách này')
        }

        // Cập nhật thời gian yêu cầu để đẩy xuống cuối danh sách
        record.returnRequestedAt = new Date()
        const saved = await this.borrowRepo.save(record)

        this.realtime.emit('librarian:dashboard-update')
        
        return saved
    }


    async renew(id: string, userId: string) {
        const record = await this.borrowRepo.findOne({
            where: { id },
            relations: { libraryCard: { user: true } }
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
        
        // Kiểm tra thẻ thư viện còn hiệu lực
        const card = record.libraryCard
        if (card.status === 'active' && card.expiryDate < toLocalDateStr()) {
            card.status = 'expired'
            await this.cardRepo.save(card)
        }
        if (card.status !== 'active') {
            throw new BadRequestException('Thẻ thư viện không hợp lệ hoặc đã hết hạn, vui lòng gia hạn thẻ trước')
        }
        
        // Kiểm tra tài khoản độc giả còn hoạt động
        if (!card.user?.isActive) {
            throw new BadRequestException('Tài khoản độc giả đã bị khóa, không thể gia hạn sách')
        }
        
        if (!record.originalDueDate) {
            record.originalDueDate = record.dueDate
        }
        
        const dueDate = new Date(record.dueDate)
        dueDate.setDate(dueDate.getDate() + 14) // gia hạn 14 ngày
        record.dueDate = toLocalDateStr(dueDate)
        
        record.renewalCount += 1
        record.renewedAt = new Date()
        record.renewedBy = { id: userId } as any
        
        if (record.status === 'overdue' && dueDate > new Date()) {
            record.status = 'borrowing'
        }
        
        const saved = await this.borrowRepo.save(record)
        
        // Emit realtime events
        this.realtime.emit('librarian:dashboard-update')
        this.realtime.emit('admin:dashboard-update')
        this.realtime.emit('reader:dashboard-update')
        
        return saved
    }
}
