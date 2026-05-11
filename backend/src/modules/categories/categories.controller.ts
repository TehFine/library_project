import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common'
import { CategoriesService } from './categories.service'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'

@Controller('categories')
export class CategoriesController {
    constructor(private readonly service: CategoriesService) { }

    @Get()
    findAll() {
        return this.service.findAll()
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    create(@Body('name') name: string) {
        return this.service.create(name)
    }
}

