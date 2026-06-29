import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common'
import { toLocalDateStr } from '@/common/utils/date'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, LessThan } from 'typeorm'
import { Notification } from './entities/notification.entity'
import { User } from '../users/entities/user.entity'
import { Role, RoleName } from '../users/entities/role.entity'
import { BorrowRecord } from '../borrow-records/entities/borrow-record.entity'
import { LibraryCard } from '../library-cards/entities/library-card.entity'
import { Fine } from '../fines/entities/fine.entity'
import { RealtimeGateway } from '@/common/websocket/realtime.gateway'
import { MailService } from '@/common/mail/mail.service'

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name)

    constructor(
        @InjectRepository(Notification) private notifRepo: Repository<Notification>,
        @InjectRepository(User) private userRepo: Repository<User>,
        @InjectRepository(Role) private roleRepo: Repository<Role>,
        @InjectRepository(BorrowRecord) private borrowRepo: Repository<BorrowRecord>,
        @InjectRepository(LibraryCard) private cardRepo: Repository<LibraryCard>,
        @InjectRepository(Fine) private fineRepo: Repository<Fine>,
        private realtime: RealtimeGateway,
        private mailService: MailService,
    ) {}

    /** Get real counts for each target group */
    async getTargetCounts() {
        const todayStr = toLocalDateStr()
        const thirtyDaysLater = new Date()
        thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)
        const thirtyDaysLaterStr = toLocalDateStr(thirtyDaysLater)

        // All active readers — 'role' is a virtual field, query via roleId instead
        const readerRole = await this.roleRepo.findOneBy({ name: RoleName.READER })
        const allReaders = await this.userRepo.count({
            where: {
                roleId: readerRole?.id ?? -1,
                isActive: true,
            },
        })

        // Readers with overdue books
        const overdueBorrows = await this.borrowRepo
            .createQueryBuilder('b')
            .where('b.status IN (:...statuses)', { statuses: ['borrowing', 'overdue'] })
            .andWhere('b.dueDate < :today', { today: todayStr })
            .select('b.libraryCardId')
            .distinct(true)
            .getRawMany()
        const overdueCount = overdueBorrows.length

        // Readers with expiring cards (within 30 days)
        const expiringCards = await this.cardRepo.count({
            where: {
                status: 'active',
                expiryDate: LessThan(thirtyDaysLaterStr),
            },
        })

        // Readers with unpaid fines
        const unpaidFines = await this.fineRepo
            .createQueryBuilder('f')
            .leftJoin('f.borrowRecord', 'br')
            .where('f.status = :status', { status: 'pending' })
            .select('br.libraryCardId')
            .distinct(true)
            .getRawMany()
        const debtCount = unpaidFines.length

        return {
            all: allReaders,
            overdue: overdueCount,
            expiring: expiringCards,
            debt: debtCount,
        }
    }

    /** List all notifications (history) */
    async list() {
        return this.notifRepo.find({
            relations: { createdBy: { profile: true } },
            order: { createdAt: 'DESC' as any },
            take: 50,
        })
    }

    /** Get a single notification */
    async findOne(id: string) {
        const notif = await this.notifRepo.findOne({
            where: { id },
            relations: { createdBy: { profile: true } },
        })
        if (!notif) throw new NotFoundException('Notification not found')
        return notif
    }

    /** Resolve target user IDs with personalization data per target group */
    private async resolveTargetUsers(
        targetGroup?: string,
        customRecipients?: string,
    ): Promise<Array<{ userId: string; replacements: Record<string, string> }>> {
        const readerRole = await this.roleRepo.findOneBy({ name: RoleName.READER })
        if (!readerRole) return []

        // Helper: get user's full name
        const getName = async (uid: string): Promise<string> => {
            const user = await this.userRepo.findOne({
                where: { id: uid },
                relations: { profile: true },
            })
            return user?.profile?.fullName || user?.username || 'Bạn'
        }

        // ── Custom recipients ──
        if (customRecipients) {
            const identifiers = customRecipients.split(',').map(s => s.trim()).filter(Boolean)
            if (identifiers.length === 0) return []

            const byEmail = await this.userRepo.find({
                where: identifiers.map(email => ({ email })),
                relations: { profile: true },
            })
            const result: Array<{ userId: string; replacements: Record<string, string> }> = []
            for (const user of byEmail) {
                result.push({
                    userId: user.id,
                    replacements: {
                        '{{tên_độc_giả}}': user.profile?.fullName || user.username,
                    },
                })
            }
            // Match by card number for remaining
            const foundIds = new Set(byEmail.map(u => u.id))
            const cardMatches = await this.cardRepo
                .createQueryBuilder('c')
                .leftJoinAndSelect('c.user', 'u')
                .leftJoin('u.profile', 'p')
                .select(['c.userId', 'c.cardNumber', 'u.username', 'p.fullName'])
                .where('c.cardNumber IN (:...numbers)', { numbers: identifiers })
                .getRawMany()
            for (const row of cardMatches) {
                if (row.c_userId && !foundIds.has(row.c_userId)) {
                    foundIds.add(row.c_userId)
                    result.push({
                        userId: row.c_userId,
                        replacements: {
                            '{{tên_độc_giả}}': row.p_fullName || row.u_username || 'Bạn',
                        },
                    })
                }
            }
            return result
        }

        if (!targetGroup) return []

        // ── All readers ──
        if (targetGroup === 'all') {
            const users = await this.userRepo.find({
                where: { roleId: readerRole.id, isActive: true },
                relations: { profile: true },
            })
            return users.map(u => ({
                userId: u.id,
                replacements: {
                    '{{tên_độc_giả}}': u.profile?.fullName || u.username,
                },
            }))
        }

        // ── Overdue readers ──
        if (targetGroup === 'overdue') {
            const today = toLocalDateStr()
            const rows = await this.borrowRepo
                .createQueryBuilder('b')
                .leftJoin('b.libraryCard', 'lc')
                .leftJoin('b.bookCopy', 'bc')
                .leftJoin('bc.book', 'bk')
                .where('b.status IN (:...statuses)', { statuses: ['borrowing', 'overdue'] })
                .andWhere('b.dueDate < :today', { today })
                .select([
                    'lc.userId',
                    'bk.title',
                    'b.dueDate',
                ])
                .orderBy('b.dueDate', 'ASC')
                .getRawMany()

            // Group by user, pick the most overdue book for each
            const userMap = new Map<string, { title: string; days: number }>()
            for (const row of rows) {
                const uid = row.lc_userId
                if (!uid) continue
                if (!userMap.has(uid)) {
                    const due = new Date(row.b_dueDate)
                    const days = Math.ceil((Date.now() - due.getTime()) / 86400000)
                    userMap.set(uid, {
                        title: row.bk_title || 'sách',
                        days: Math.max(1, days),
                    })
                }
            }

            const result: Array<{ userId: string; replacements: Record<string, string> }> = []
            for (const [uid, data] of userMap) {
                const name = await getName(uid)
                result.push({
                    userId: uid,
                    replacements: {
                        '{{tên_độc_giả}}': name,
                        '{{số_ngày}}': String(data.days),
                        '{{tên_sách}}': data.title,
                    },
                })
            }
            return result
        }

        // ── Expiring cards ──
        if (targetGroup === 'expiring') {
            const thirtyDaysLater = toLocalDateStr(new Date(Date.now() + 30 * 86400000))
            const cards = await this.cardRepo.find({
                where: { status: 'active' },
                relations: { user: { profile: true } },
            })
            const result: Array<{ userId: string; replacements: Record<string, string> }> = []
            const seen = new Set<string>()
            for (const card of cards) {
                if (card.expiryDate && card.expiryDate <= thirtyDaysLater && !seen.has(card.userId)) {
                    seen.add(card.userId)
                    const user = card.user
                    const expiry = new Date(card.expiryDate)
                    const formatted = `${expiry.getDate()}/${expiry.getMonth() + 1}/${expiry.getFullYear()}`
                    result.push({
                        userId: card.userId,
                        replacements: {
                            '{{tên_độc_giả}}': user?.profile?.fullName || user?.username || 'Bạn',
                            '{{mã_thẻ}}': card.cardNumber,
                            '{{ngày_hết_hạn}}': formatted,
                        },
                    })
                }
            }
            return result
        }

        // ── Debt (unpaid fines) ──
        if (targetGroup === 'debt') {
            const rows = await this.fineRepo
                .createQueryBuilder('f')
                .leftJoin('f.borrowRecord', 'br')
                .leftJoin('br.libraryCard', 'lc')
                .where('f.status = :status', { status: 'pending' })
                .select(['lc.userId', 'f.amount'])
                .getRawMany()

            // Aggregate total per user
            const userTotals = new Map<string, number>()
            for (const row of rows) {
                const uid = row.lc_userId
                if (!uid) continue
                userTotals.set(uid, (userTotals.get(uid) || 0) + Number(row.f_amount))
            }

            const result: Array<{ userId: string; replacements: Record<string, string> }> = []
            for (const [uid, total] of userTotals) {
                const name = await getName(uid)
                result.push({
                    userId: uid,
                    replacements: {
                        '{{tên_độc_giả}}': name,
                        '{{số_tiền}}': total.toLocaleString('vi-VN'),
                    },
                })
            }
            return result
        }

        return []
    }

    /** Get notifications for a reader */
    async getMyNotifications(userId: string) {
        return this.notifRepo.find({
            where: { userId },
            order: { createdAt: 'DESC' as any },
            take: 50,
        })
    }

    /** Get unread notification count for a reader */
    async getUnreadCount(userId: string) {
        const count = await this.notifRepo.count({
            where: { userId, read: false },
        })
        return { count }
    }

    /** Mark a notification as read */
    async markAsRead(notifId: string, userId: string) {
        const notif = await this.notifRepo.findOneBy({ id: notifId, userId })
        if (!notif) throw new NotFoundException('Notification not found')
        await this.notifRepo.update(notifId, { read: true })
        return { success: true }
    }

    /** Create and optionally send a notification */
    async create(dto: {
        title: string
        content: string
        targetGroup?: string
        customRecipients?: string
        variables?: string[]
        status?: 'draft' | 'sent'
        createdById: string
    }) {
        // Determine recipient count
        let recipientCount = 0
        if (dto.customRecipients) {
            recipientCount = dto.customRecipients.split(',').map(s => s.trim()).filter(Boolean).length
        } else if (dto.targetGroup) {
            const counts = await this.getTargetCounts()
            recipientCount = (counts as any)[dto.targetGroup] ?? 0
        }

        const notif = new Notification()
        notif.notificationType = 'bulk'
        notif.title = dto.title
        notif.content = dto.content
        if (dto.targetGroup !== undefined) notif.targetGroup = dto.targetGroup
        if (dto.customRecipients !== undefined) notif.customRecipients = dto.customRecipients
        notif.variables = dto.variables || []
        notif.recipientCount = recipientCount
        notif.sentCount = 0
        notif.status = dto.status || 'draft'
        notif.createdById = dto.createdById
        if (dto.status === 'sent') notif.sentAt = new Date()

        const saved = await this.notifRepo.save(notif)

        // If sending, create individual notification records per reader + emit realtime
        if (dto.status === 'sent') {
            const targetUsers = await this.resolveTargetUsers(dto.targetGroup, dto.customRecipients)

            // Create individual notification records for each target reader (with personalized content)
            if (targetUsers.length > 0) {
                const individualNotifs = targetUsers.map(({ userId, replacements }) => {
                    // Apply personalization replacements to content
                    let personalizedContent = saved.content
                    let personalizedTitle = saved.title
                    for (const [key, value] of Object.entries(replacements)) {
                        personalizedContent = personalizedContent.split(key).join(value)
                        personalizedTitle = personalizedTitle.split(key).join(value)
                    }

                    const n = new Notification()
                    n.notificationType = 'individual'
                    n.title = personalizedTitle
                    n.content = personalizedContent
                    n.userId = userId
                    n.read = false
                    n.status = 'sent'
                    n.createdById = dto.createdById
                    n.sentAt = new Date()
                    return n
                })
                // Batch insert in chunks to avoid memory issues
                const chunkSize = 100
                for (let i = 0; i < individualNotifs.length; i += chunkSize) {
                    await this.notifRepo.save(individualNotifs.slice(i, i + chunkSize))
                }
                saved.sentCount = targetUsers.length
                await this.notifRepo.save(saved)
            }

            // ── Send actual emails via MailService ──
            if (targetUsers.length > 0) {
                // Batch-lookup user emails
                const userIds = targetUsers.map(t => t.userId)
                const users = await this.userRepo.find({
                    where: userIds.map(id => ({ id })),
                    relations: { profile: true },
                })
                const emailMap = new Map(users.map(u => [u.id, u]))

                const emailPromises = targetUsers.map(async ({ userId, replacements }) => {
                    const user = emailMap.get(userId)
                    if (!user?.email) return

                    // Personalize content
                    let personalContent = saved.content
                    let personalTitle = saved.title
                    for (const [key, value] of Object.entries(replacements)) {
                        personalContent = personalContent.split(key).join(value)
                        personalTitle = personalTitle.split(key).join(value)
                    }

                    const html = this.buildNotificationEmailTemplate(personalTitle, personalContent)
                    return this.mailService.sendMail(user.email, personalTitle, html)
                })

                // Send all emails concurrently (fire-and-forget, don't block if some fail)
                const results = await Promise.allSettled(emailPromises)
                const successCount = results.filter(r => r.status === 'fulfilled' && r.value === true).length
                this.logger.log(`Bulk email: ${successCount}/${targetUsers.length} sent successfully`)
            }

            // Emit realtime — send generic content to avoid showing raw placeholders in toast
            this.realtime.emit('admin:notification-update')
            // Only emit reader:notification to targeted readers (include targetUserIds for client-side filtering)
            const targetUserIds = targetUsers.map(t => t.userId)
            if (targetUserIds.length > 0) {
                this.realtime.emit('reader:notification', {
                    id: saved.id,
                    title: saved.title,
                    content: '📬 Bạn có thông báo mới từ thư viện. Vui lòng xem chi tiết trong trang Thông báo.',
                    createdAt: saved.createdAt,
                    targetUserIds,
                })
            }
        }

        return this.findOne(saved.id)
    }

    /** Send a test notification to the admin's email */
    async sendTest(id: string) {
        const notif = await this.notifRepo.findOne({
            where: { id },
            relations: { createdBy: { profile: true } },
        })
        if (!notif) throw new NotFoundException('Notification not found')

        const admin = notif.createdBy
        const adminEmail = admin?.email
        if (!adminEmail) throw new BadRequestException('Cannot find admin email')

        const html = this.buildNotificationEmailTemplate(
            `[Test] ${notif.title}`,
            `Đây là email thử nghiệm cho thông báo:<br><br>${notif.content.replace(/\n/g, '<br>')}`,
        )

        const sent = await this.mailService.sendMail(adminEmail, `[Test] ${notif.title}`, html)

        if (!sent) {
            this.logger.warn(`Test email to ${adminEmail} was not sent (mail not configured)`)
            return { message: 'Email thử nghiệm được ghi vào console (mail chưa được cấu hình)', id }
        }

        return { message: 'Đã gửi thông báo thử nghiệm đến email của bạn', id }
    }

    /** Update draft */
    async updateDraft(id: string, dto: Partial<{
        title: string
        content: string
        targetGroup: string
        customRecipients: string
        variables: string[]
    }>) {
        const notif = await this.notifRepo.findOneBy({ id })
        if (!notif) throw new NotFoundException('Notification not found')
        if (notif.status !== 'draft') throw new BadRequestException('Cannot edit sent notification')

        await this.notifRepo.update(id, dto as any)
        return this.findOne(id)
    }

    /** Build a nice HTML email template for bulk notifications */
    private buildNotificationEmailTemplate(title: string, bodyContent: string): string {
        return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f6f9;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="540" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.06);overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#d97706,#b45309);padding:28px 36px;text-align:center;">
              <div style="width:48px;height:48px;background:rgba(255,255,255,0.2);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:10px;">
                <span style="font-size:24px;">📬</span>
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">${title}</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Thư viện Bookly</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 36px;">
              <div style="color:#374151;font-size:14px;line-height:1.7;">
                ${bodyContent.replace(/\n/g, '<br>')}
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 36px;text-align:center;border-top:1px solid #f3f4f6;">
              <p style="margin:0 0 6px;color:#9ca3af;font-size:11px;">
                © ${new Date().getFullYear()} Hệ thống Quản lý Thư viện Bookly
              </p>
              <p style="margin:0;color:#9ca3af;font-size:10px;">
                Email này được gửi tự động từ hệ thống quản lý thư viện.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
    }
}
