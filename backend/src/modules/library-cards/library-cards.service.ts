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

    async create(dto: Partial<LibraryCard>, adminId: string) {
        const card = this.cardRepo.create({
            ...dto,
            issuedBy: { id: adminId } as any
        })
        return this.cardRepo.save(card)
    }
}

