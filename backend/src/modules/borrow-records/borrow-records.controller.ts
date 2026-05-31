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

    @Get('copy/:code')
    findByCopyCode(@Param('code') code: string) {
        return this.service.findByCopyCode(code)
    }

    @Get('by-card/:cardNumber')
    findByCardNumber(@Param('cardNumber') cardNumber: string) {
        return this.service.findByCardNumber(cardNumber)
    }

    @Get('mine')
    findMine(@Req() req: any, @Query() query: any) {
        return this.service.findMine(req.user.userId, query)
    }

    @Post()
    borrow(@Body() dto: { cardId: string; copyId: string; requestId?: string }, @Req() req: any) {
        return this.service.borrow(dto, req.user.userId)
    }

    @Patch(':id/return')
    returnBook(@Param('id') id: string, @Body() body: { condition: string; paymentMethod?: string }, @Req() req: any) {
        return this.service.returnBook(id, body.condition, body.paymentMethod, req.user.userId)
    }

    @Get('search-by-book-title')
    searchByBookTitle(@Query('q') q: string) {
        return this.service.searchByBookTitle(q || '')
    }

    @Get('pending-returns')
    pendingReturns() {
        return this.service.findPendingReturns()
    }

    @Post(':id/request-return')
    requestReturn(@Param('id') id: string, @Req() req: any) {
        return this.service.requestReturn(id, req.user.userId)
    }

    @Post(':id/approve-return')
    approveReturn(@Param('id') id: string, @Body() body: { condition: string }, @Req() req: any) {
        return this.service.approveReturn(id, req.user.userId, body.condition)
    }

    @Post(':id/simulate-return')
    simulateReturn(@Param('id') id: string, @Req() req: any) {
        return this.service.simulateReturn(id, req.user.userId)
    }

    @Post(':id/renew')
    renew(@Param('id') id: string, @Req() req: any) {
        return this.service.renew(id, req.user.userId)
    }
}

