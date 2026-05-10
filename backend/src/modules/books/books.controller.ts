import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common'
import { BooksService } from './books.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@Controller('books')
export class BooksController {
    constructor(private readonly booksService: BooksService) { }

    @Get()
    findAll() {
        return this.booksService.findAll()
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
