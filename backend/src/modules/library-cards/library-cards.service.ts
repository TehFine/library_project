import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { LibraryCard } from './entities/library-card.entity'

@Injectable()
export class LibraryCardsService {
    constructor(
        @InjectRepository(LibraryCard)
        private cardRepo: Repository<LibraryCard>,
    ) { }

    async findAll() {
        return this.cardRepo.find({ relations: ['user'] })
    }

    async findByCardNumber(cardNumber: string) {
        const card = await this.cardRepo.findOne({
            where: { cardNumber },
            relations: ['user']
        })
        if (!card) throw new NotFoundException('Không tìm thấy thẻ thư viện')
        return card
    }

    async findMine(userId: string) {
        return this.cardRepo.find({
            where: { userId },
            order: { createdAt: 'DESC' }
        })
    }

    async create(dto: Partial<LibraryCard>, creatorId: string) {
        const issuedDate = dto.issuedDate || new Date().toISOString().split('T')[0]
        const expiryDate = dto.expiryDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
        const cardNumber = dto.cardNumber || `TV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
        
        const card = this.cardRepo.create({
            userId: creatorId,
            ...dto,
            cardNumber,
            issuedDate,
            expiryDate,
            issuedBy: { id: creatorId } as any // Trong demo coi như tự cấp hoặc admin cấp
        })
        return this.cardRepo.save(card)
    }
}

