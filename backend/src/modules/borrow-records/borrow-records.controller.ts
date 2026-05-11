import { Controller, Get, Post, Body, Param, UseGuards, Req, Patch, Query } from '@nestjs/common'
import { BorrowRecordsService } from './borrow-records.service'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'

@Controller('borrow-records')
@UseGuards(JwtAuthGuard)
export class BorrowRecordsController {
    constructor(private readonly service: BorrowRecordsService) { }

    @Get()
    findAll() {
        return this.service.findAll()
    }

    @Get('mine')
    findMine(@Req() req: any, @Query() query: any) {
        return this.service.findMine(req.user.userId, query)
    }

    @Post()
    borrow(@Body() dto: { cardId: string; copyId: string }, @Req() req: any) {
        return this.service.borrow(dto, req.user.userId)
    }

    @Patch(':id/return')
    returnBook(@Param('id') id: string, @Body() body: { condition: string }) {
        return this.service.returnBook(id, body.condition)
    }
}

