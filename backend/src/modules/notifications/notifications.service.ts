import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, LessThan } from 'typeorm'
import { Notification } from './entities/notification.entity'
import { User } from '../users/entities/user.entity'
import { Role, RoleName } from '../users/entities/role.entity'
import { BorrowRecord } from '../borrow-records/entities/borrow-record.entity'
import { LibraryCard } from '../library-cards/entities/library-card.entity'
import { Fine } from '../fines/entities/fine.entity'
import { RealtimeGateway } from '@/common/websocket/realtime.gateway'

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification) private notifRepo: Repository<Notification>,
        @InjectRepository(User) private userRepo: Repository<User>,
        @InjectRepository(Role) private roleRepo: Repository<Role>,
        @InjectRepository(BorrowRecord) private borrowRepo: Repository<BorrowRecord>,
        @InjectRepository(LibraryCard) private cardRepo: Repository<LibraryCard>,
        @InjectRepository(Fine) private fineRepo: Repository<Fine>,
        private realtime: RealtimeGateway,
    ) {}

    /** Get real counts for each target group */
    async getTargetCounts() {
        const today = new Date()
        const todayStr = today.toISOString().split('T')[0]
        const thirtyDaysLater = new Date(today.getTime() + 30 * 86400000).toISOString().split('T')[0]

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
                expiryDate: LessThan(thirtyDaysLater),
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

        // If sending, emit realtime event
        if (dto.status === 'sent') {
            this.realtime.emit('admin:notification-update')
        }

        return this.findOne(saved.id)
    }

    /** Send a test notification to the admin's email */
    async sendTest(id: string) {
        const notif = await this.notifRepo.findOneBy({ id })
        if (!notif) throw new NotFoundException('Notification not found')

        // In a real system, this would send an email via nodemailer
        return { message: 'Đã gửi thông báo thử nghiệm', id }
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
}
