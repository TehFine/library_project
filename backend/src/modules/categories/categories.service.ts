import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Category } from './entities/category.entity'

@Injectable()
export class CategoriesService {
    constructor(
        @InjectRepository(Category)
        private catRepo: Repository<Category>,
    ) { }

    async findAll() {
        return this.catRepo.find()
    }

    async create(name: string) {
        const cat = this.catRepo.create({ name })
        return this.catRepo.save(cat)
    }
}

