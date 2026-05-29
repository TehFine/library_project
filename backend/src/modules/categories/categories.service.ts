import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Category } from './entities/category.entity'
import { RealtimeGateway } from '@/common/websocket/realtime.gateway'

@Injectable()
export class CategoriesService {
    constructor(
        @InjectRepository(Category)
        private catRepo: Repository<Category>,
        private realtime: RealtimeGateway,
    ) { }

    async findAll() {
        return this.catRepo.find()
    }

    async create(name: string) {
        const cat = this.catRepo.create({ name })
        const saved = await this.catRepo.save(cat)
        this.realtime.emit('admin:dashboard-update')
        return saved
    }
}

