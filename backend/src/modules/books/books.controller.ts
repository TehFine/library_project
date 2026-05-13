import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common'
import { BooksService } from './books.service'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'

@Controller('books')
export class BooksController {
    constructor(private readonly booksService: BooksService) { }

    @Get()
    findAll(
        @Query('page')       page?: string,
        @Query('limit')      limit?: string,
        @Query('search')     search?: string,
        @Query('categoryId') categoryId?: string,
        @Query('available')  available?: string,
    ) {
        return this.booksService.findAll({
            page:       page       ? parseInt(page)       : undefined,
            limit:      limit      ? parseInt(limit)      : undefined,
            search:     search     || undefined,
            categoryId: categoryId ? parseInt(categoryId) : undefined,
            available:  available  === '1' || available === 'true',
        })
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.booksService.findOne(id)
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    create(@Body() dto: any, @Req() req: any) {
        return this.booksService.create(dto, req.user.userId)
    }

    @Post(':id/copies')
    @UseGuards(JwtAuthGuard)
    createCopy(@Param('id') id: string, @Body() dto: any) {
        return this.booksService.createCopy(id, dto)
    }
}

