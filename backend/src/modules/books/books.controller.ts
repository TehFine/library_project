import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common'
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

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    update(@Param('id') id: string, @Body() dto: any) {
        return this.booksService.update(id, dto)
    }

    @Post(':id/copies')
    @UseGuards(JwtAuthGuard)
    createCopy(@Param('id') id: string, @Body() dto: any) {
        return this.booksService.createCopy(id, dto)
    }

    @Patch('copies/:id')
    @UseGuards(JwtAuthGuard)
    updateCopy(@Param('id') id: string, @Body() dto: any) {
        return this.booksService.updateCopy(id, dto)
    }

    @Delete('copies/:id')
    @UseGuards(JwtAuthGuard)
    removeCopy(@Param('id') id: string) {
        return this.booksService.removeCopy(id)
    }

    @Get('copies/search')
    @UseGuards(JwtAuthGuard)
    searchCopies(@Query('q') q: string) {
        return this.booksService.searchCopies(q)
    }

    @Get('copies/:code')
    @UseGuards(JwtAuthGuard)
    findCopyByCode(@Param('code') code: string) {
        return this.booksService.findCopyByCode(code)
    }

    @Get(':id/available-copies')
    @UseGuards(JwtAuthGuard)
    getAvailableCopies(@Param('id') id: string) {
        return this.booksService.getAvailableCopies(id)
    }
}

