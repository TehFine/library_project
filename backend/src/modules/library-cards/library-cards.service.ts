import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { LibraryCard } from './entities/library-card.entity'
import { RealtimeGateway } from '@/common/websocket/realtime.gateway'
import { NotificationsService } from '../notifications/notifications.service'

@Injectable()
export class LibraryCardsService {
    constructor(
        @InjectRepository(LibraryCard)
        private cardRepo: Repository<LibraryCard>,
        private realtime: RealtimeGateway,
        private notifService: NotificationsService,
    ) { }

    async findAll() {
        const cards = await this.cardRepo.find({ relations: { user: { profile: true } } })
        return this.checkAndUpdateStatus(cards)
    }

    async search(q: string) {
        // Dùng QueryBuilder vì fullName giờ nằm trong user_profiles
        const cards = await this.cardRepo
            .createQueryBuilder('card')
            .leftJoinAndSelect('card.user', 'user')
            .leftJoinAndSelect('user.profile', 'profile')
            .where('card.cardNumber LIKE :q', { q: `%${q}%` })
            .orWhere('LOWER(profile.fullName) LIKE LOWER(:q)', { q: `%${q}%` })
            .orWhere('LOWER(user.username) LIKE LOWER(:q)', { q: `%${q}%` })
            .take(20)
            .getMany()
        return this.checkAndUpdateStatus(cards)
    }

    async findByCardNumber(cardNumber: string) {
        const card = await this.cardRepo.findOne({
            where: { cardNumber },
            relations: { user: { profile: true } }
        })
        if (!card) throw new NotFoundException('Không tìm thấy thẻ thư viện')
        return this.checkAndUpdateStatus(card)
    }

    async findMine(userId: string) {
        const cards = await this.cardRepo.find({
            where: { userId },
            order: { createdAt: 'DESC' }
        })
        return this.checkAndUpdateStatus(cards)
    }

    async findByIdWithDetails(id: string) {
        const card = await this.cardRepo.findOne({
            where: { id },
            relations: { user: { profile: true }, borrowRecords: { bookCopy: { book: true } } }
        })
        if (!card) throw new NotFoundException('Card not found')
        return this.checkAndUpdateStatus(card)
    }

    async create(dto: Partial<LibraryCard>, creatorId: string) {
        const targetUserId = dto.userId || creatorId;
        const existingCard = await this.cardRepo.findOne({ where: { userId: targetUserId } });
        if (existingCard) {
            throw new BadRequestException('Người dùng này đã có thẻ thư viện. Vui lòng sử dụng chức năng Gia hạn.');
        }

        const issuedDate = dto.issuedDate || new Date().toISOString().split('T')[0]
        const expiryDate = dto.expiryDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
        const cardNumber = dto.cardNumber || `TV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`

        const card = this.cardRepo.create({
            userId: targetUserId,
            ...dto,
            cardNumber,
            issuedDate,
            expiryDate,
            issuedBy: { id: creatorId } as any
        })
        this.realtime.emit('admin:dashboard-update')
        this.realtime.emit('reader:dashboard-update')
        
        return this.cardRepo.save(card)
    }

    async renew(id: string, durationStr: string) {
        const card = await this.cardRepo.findOne({ where: { id } })
        if (!card) throw new NotFoundException('Không tìm thấy thẻ')

        const currentExpiry = new Date(card.expiryDate)
        const today = new Date()

        const diffTime = currentExpiry.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays > 30) {
            throw new BadRequestException('Chỉ có thể gia hạn khi thẻ đã hết hạn hoặc sắp hết hạn trong vòng 30 ngày tới.')
        }

        const newExpiry = isNaN(currentExpiry.getTime()) || currentExpiry < today ? new Date() : currentExpiry;

        let addYears = 1
        let addMonths = 0
        if (durationStr === '6m') {
            addYears = 0
            addMonths = 6
        }
        if (durationStr === '2y') addYears = 2

        newExpiry.setFullYear(newExpiry.getFullYear() + addYears)
        newExpiry.setMonth(newExpiry.getMonth() + addMonths)

        card.expiryDate = newExpiry.toISOString().split('T')[0]
        card.status = 'active'
        this.realtime.emit('admin:dashboard-update')
        this.realtime.emit('reader:dashboard-update')
        
        return this.cardRepo.save(card)
    }

    // ── Reader requests card activation ──
    async requestActivation(userId: string) {
        // Check if user already has a card
        const existing = await this.cardRepo.findOne({ where: { userId } })
        if (existing) {
            if (existing.status === 'active') {
                throw new BadRequestException('Bạn đã có thẻ thư viện hoạt động')
            }
            if (existing.status === 'pending') {
                throw new BadRequestException('Yêu cầu cấp thẻ của bạn đang chờ duyệt')
            }
            if (existing.status === 'rejected') {
                // Allow re-request by updating the existing pending card
                existing.status = 'pending'
                existing.issuedDate = new Date().toISOString().split('T')[0]
                existing.expiryDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
                const saved = await this.cardRepo.save(existing)
                this.realtime.emit('librarian:dashboard-update')
                this.realtime.emit('reader:dashboard-update')
                return saved
            }
        }

        const issuedDate = new Date().toISOString().split('T')[0]
        const expiryDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
        const cardNumber = `TV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`

        const card = this.cardRepo.create({
            userId,
            cardNumber,
            issuedDate,
            expiryDate,
            status: 'pending',
        })

        const saved = await this.cardRepo.save(card)
        this.realtime.emit('librarian:dashboard-update')
        this.realtime.emit('reader:dashboard-update')
        return saved
    }

    // ── Librarian gets pending activation requests ──
    async getPendingActivations() {
        const cards = await this.cardRepo.find({
            where: { status: 'pending' },
            relations: { user: { profile: true } },
            order: { createdAt: 'ASC' },
        })
        return cards
    }

    // ── Librarian approves card activation ──
    async approveActivation(cardId: string, librarianId: string) {
        const card = await this.cardRepo.findOne({
            where: { id: cardId },
            relations: { user: { profile: true } },
        })
        if (!card) throw new NotFoundException('Không tìm thấy yêu cầu cấp thẻ')
        if (card.status !== 'pending') throw new BadRequestException('Yêu cầu này đã được xử lý')

        card.status = 'active'
        card.issuedDate = new Date().toISOString().split('T')[0]
        card.issuedBy = { id: librarianId } as any
        const saved = await this.cardRepo.save(card)

        // Send notification to reader
        await this.notifService.create({
            title: 'Thẻ thư viện đã được kích hoạt',
            content: `Thẻ thư viện ${card.cardNumber} của bạn đã được kích hoạt thành công. Bạn có thể mượn sách ngay bây giờ.`,
            customRecipients: card.user?.email,
            status: 'sent',
            createdById: librarianId,
        })

        this.realtime.emit('librarian:dashboard-update')
        this.realtime.emit('reader:dashboard-update')
        this.realtime.emit('reader:notification')
        return saved
    }

    // ── Librarian rejects card activation ──
    async rejectActivation(cardId: string, librarianId: string) {
        const card = await this.cardRepo.findOne({
            where: { id: cardId },
            relations: { user: { profile: true } },
        })
        if (!card) throw new NotFoundException('Không tìm thấy yêu cầu cấp thẻ')
        if (card.status !== 'pending') throw new BadRequestException('Yêu cầu này đã được xử lý')

        card.status = 'rejected'
        const saved = await this.cardRepo.save(card)

        // Send notification to reader
        await this.notifService.create({
            title: 'Yêu cầu cấp thẻ bị từ chối',
            content: `Yêu cầu cấp thẻ thư viện của bạn đã bị từ chối. Vui lòng liên hệ thủ thư để biết thêm chi tiết.`,
            customRecipients: card.user?.email,
            status: 'sent',
            createdById: librarianId,
        })

        this.realtime.emit('librarian:dashboard-update')
        this.realtime.emit('reader:dashboard-update')
        this.realtime.emit('reader:notification')
        return saved
    }

    private async checkAndUpdateStatus<T extends LibraryCard | LibraryCard[]>(data: T): Promise<T> {
        if (!data) return data;
        const today = new Date().toISOString().split('T')[0];
        const cards = Array.isArray(data) ? data : [data];

        for (const card of cards) {
            if (card && card.status === 'active' && card.expiryDate < today) {
                card.status = 'expired';
                await this.cardRepo.save(card);
            }
        }

        return data;
    }
}
