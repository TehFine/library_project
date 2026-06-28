import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, LessThan } from 'typeorm'
import { toLocalDateStr } from '@/common/utils/date'
import { BorrowRecord } from '@/modules/borrow-records/entities/borrow-record.entity'
import { Reservation } from '@/modules/reservations/entities/reservation.entity'
import { BookCopy } from '@/modules/books/entities/book-copy.entity'
import { Notification } from '@/modules/notifications/entities/notification.entity'
import { User } from '@/modules/users/entities/user.entity'
import { Role, RoleName } from '@/modules/users/entities/role.entity'
import { Fine } from '@/modules/fines/entities/fine.entity'
import { SystemConfig } from '@/modules/admin/entities/system-config.entity'
import { RealtimeGateway } from '@/common/websocket/realtime.gateway'

@Injectable()
export class SystemTasksService {
    private readonly logger = new Logger(SystemTasksService.name)

    constructor(
        @InjectRepository(BorrowRecord)
        private borrowRepo: Repository<BorrowRecord>,
        @InjectRepository(Reservation)
        private resRepo: Repository<Reservation>,
        @InjectRepository(BookCopy)
        private copyRepo: Repository<BookCopy>,
        @InjectRepository(Notification)
        private notifRepo: Repository<Notification>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
        @InjectRepository(Role)
        private roleRepo: Repository<Role>,
        @InjectRepository(Fine)
        private fineRepo: Repository<Fine>,
        @InjectRepository(SystemConfig)
        private configRepo: Repository<SystemConfig>,
        private realtime: RealtimeGateway,
    ) { }

    // ── Helpers ─────────────────────────────────────────────────────────
    private async isTaskEnabled(taskId: string): Promise<boolean> {
        try {
            const config = await this.configRepo.findOneBy({ key: `task_enabled_${taskId}` })
            return config?.value !== 'false'
        } catch {
            return true
        }
    }

    private async getSystemUserId(): Promise<string | null> {
        try {
            const adminRole = await this.roleRepo.findOneBy({ name: RoleName.LIBRARY_ADMIN })
            if (!adminRole) return null
            const admin = await this.userRepo.findOne({ where: { roleId: adminRole.id } })
            return admin?.id || null
        } catch {
            return null
        }
    }

    // ─── 1. Reservation hết hạn ──────────────────────────────────────────
    // Chạy mỗi giờ. Các reservation 'notified' quá expiresAt -> expired, trả sách về available
    @Cron(CronExpression.EVERY_HOUR)
    async processExpiredReservations() {
        try {
            if (!(await this.isTaskEnabled('expired_reservations'))) return
            const now = new Date()
            const expiredReservations = await this.resRepo.find({
                where: { status: 'notified', expiresAt: LessThan(now) },
                relations: { libraryCard: { user: { profile: true } }, book: true },
            })

            if (expiredReservations.length === 0) return

            let releasedCount = 0
            for (const res of expiredReservations) {
                res.status = 'expired'
                await this.resRepo.save(res)

                if (res.reservedCopyId) {
                    const copy = await this.copyRepo.findOne({ where: { id: res.reservedCopyId } })
                    if (copy && copy.status === 'reserved') {
                        copy.status = 'available'
                        await this.copyRepo.save(copy)
                        releasedCount++
                    }
                }
            }

            this.logger.log(
                `Đã xử lý ${expiredReservations.length} reservation hết hạn, trả ${releasedCount} bản sao về kho`,
            )

            this.realtime.emit('librarian:dashboard-update')
            this.realtime.emit('admin:dashboard-update')
        } catch (error) {
            this.logger.error('Lỗi xử lý reservation hết hạn:', error)
        }
    }

    // ─── 2. Nhắc sắp đến hạn (3 ngày) ───────────────────────────────────
    // Chạy 8:00 hàng ngày. Tìm borrow dueDate = today+3, tạo notification + realtime
    @Cron('0 8 * * *')
    async sendDueDateReminders() {
        try {
            if (!(await this.isTaskEnabled('due_reminders'))) return
            const targetDate = new Date()
            targetDate.setDate(targetDate.getDate() + 3)
            const targetDateStr = toLocalDateStr(targetDate)

            const dueBorrows = await this.borrowRepo.find({
                where: { dueDate: targetDateStr, status: 'borrowing' },
                relations: { libraryCard: { user: { profile: true } }, bookCopy: { book: true } },
            })

            if (dueBorrows.length === 0) {
                this.logger.log(`Nhắc hạn ${targetDateStr}: không có phiếu mượn nào`)
                return
            }

            const systemUserId = await this.getSystemUserId()
            let sentCount = 0

            for (const b of dueBorrows) {
                const userId = b.libraryCard?.user?.id
                if (!userId) continue

                const readerName = b.libraryCard?.user?.profile?.fullName || b.libraryCard?.user?.username || 'Bạn'
                const bookTitle = b.bookCopy?.book?.title || 'sách'

                const notification = this.notifRepo.create({
                    notificationType: 'individual',
                    title: '📚 Sắp đến hạn trả sách',
                    content: `${readerName} thân mến,\n\nSách "${bookTitle}" của bạn sắp đến hạn trả vào ngày ${targetDateStr} (3 ngày nữa).\n\nVui lòng trả sách đúng hạn để tránh phát sinh phí phạt.`,
                    userId,
                    read: false,
                    status: 'sent',
                    sentAt: new Date(),
                    createdById: systemUserId || 'system',
                })
                await this.notifRepo.save(notification)

                this.realtime.emitToUser(userId, 'reader:notification', {
                    id: notification.id,
                    title: notification.title,
                    content: `📚 Sách "${bookTitle}" sắp đến hạn trả vào ngày ${targetDateStr}. Vui lòng trả đúng hạn!`,
                    createdAt: notification.createdAt,
                })

                sentCount++
            }

            this.logger.log(`Đã gửi nhắc hạn ${targetDateStr} cho ${sentCount}/${dueBorrows.length} độc giả`)
        } catch (error) {
            this.logger.error('Lỗi gửi nhắc hạn:', error)
        }
    }

    // ─── 3. Cảnh báo quá hạn ─────────────────────────────────────────────
    // Chạy 9:00 hàng ngày. Tìm borrow quá hạn, gom theo user, gửi 1 notif tổng hợp
    @Cron('0 9 * * *')
    async sendOverdueWarnings() {
        try {
            if (!(await this.isTaskEnabled('overdue_warnings'))) return
            const todayStr = toLocalDateStr()
            const systemUserId = await this.getSystemUserId()

            const overdueBorrows = await this.borrowRepo.find({
                where: [
                    { status: 'borrowing', dueDate: LessThan(todayStr) },
                    { status: 'overdue' },
                ],
                relations: { libraryCard: { user: { profile: true } }, bookCopy: { book: true } },
            })

            // Gom theo user để gửi 1 thông báo tổng hợp
            const userMap = new Map<string, { name: string; books: { title: string; days: number }[] }>()
            for (const b of overdueBorrows) {
                const userId = b.libraryCard?.user?.id
                if (!userId) continue
                if (!userMap.has(userId)) {
                    userMap.set(userId, {
                        name: b.libraryCard?.user?.profile?.fullName || b.libraryCard?.user?.username || 'Bạn',
                        books: [],
                    })
                }
                const dueDate = new Date(b.dueDate)
                const todayMidnight = new Date()
                todayMidnight.setHours(0, 0, 0, 0)
                const diffTime = todayMidnight.getTime() - dueDate.getTime()
                const diffDays = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)))
                userMap.get(userId)!.books.push({
                    title: b.bookCopy?.book?.title || '—',
                    days: diffDays,
                })
            }

            if (userMap.size === 0) {
                this.logger.log('Cảnh báo quá hạn: không có độc giả nào quá hạn')
                return
            }

            let sentCount = 0
            for (const [userId, data] of userMap) {
                const bookList = data.books.map(b => `• "${b.title}" — trễ ${b.days} ngày`).join('\n')
                const totalFines = this.calcTotalFine(data.books)

                const notification = this.notifRepo.create({
                    notificationType: 'individual',
                    title: '⚠️ Cảnh báo quá hạn trả sách',
                    content: `${data.name} thân mến,\n\nBạn đang quá hạn trả ${data.books.length} cuốn sách:\n${bookList}\n\nTổng phí phạt hiện tại: ${totalFines.toLocaleString('vi-VN')}đ\n\nVui lòng trả sách ngay để tránh phí phạt tăng thêm.`,
                    userId,
                    read: false,
                    status: 'sent',
                    sentAt: new Date(),
                    createdById: systemUserId || 'system',
                })
                await this.notifRepo.save(notification)

                this.realtime.emitToUser(userId, 'reader:notification', {
                    id: notification.id,
                    title: notification.title,
                    content: `⚠️ Bạn đang quá hạn ${data.books.length} cuốn sách. Vui lòng xem chi tiết!`,
                    createdAt: notification.createdAt,
                })

                sentCount++
            }

            this.logger.log(`Đã gửi cảnh báo quá hạn cho ${sentCount} độc giả`)
        } catch (error) {
            this.logger.error('Lỗi gửi cảnh báo quá hạn:', error)
        }
    }

    private calcTotalFine(books: { title: string; days: number }[]): number {
        let total = 0
        for (const b of books) {
            if (b.days <= 5) total += b.days * 1000
            else total += 5 * 1000 + (b.days - 5) * 3000
        }
        return total
    }

    // ─── 4. Backup dữ liệu ──────────────────────────────────────────────
    // Chạy 2:00 hàng ngày. Ghi log thống kê (sẽ mở rộng thành backup thật sau)
    @Cron('0 2 * * *')
    async logBackupEvent() {
        try {
            if (!(await this.isTaskEnabled('backup'))) return
            this.logger.log(`[BACKUP] Bắt đầu lúc ${new Date().toISOString()}`)

            const [totalUsers, totalBorrows, totalFines] = await Promise.all([
                this.userRepo.count(),
                this.borrowRepo.count(),
                this.fineRepo.count(),
            ])

            this.logger.log(
                `[BACKUP] Hoàn tất. Thống kê: ${totalUsers} users, ${totalBorrows} lượt mượn, ${totalFines} khoản phí`,
            )

            this.realtime.emit('admin:dashboard-update')
        } catch (error) {
            this.logger.error('Lỗi backup:', error)
        }
    }
}
