import { Controller, Get, Post, Body, Param, UseGuards, Req, Patch } from '@nestjs/common'
import { BorrowRequestsService } from './borrow-requests.service'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'

@Controller('borrow-requests')
@UseGuards(JwtAuthGuard)
export class BorrowRequestsController {
    constructor(private readonly service: BorrowRequestsService) { }

    @Post()
    create(@Body('bookId') bookId: string, @Req() req: any) {
        return this.service.create(req.user.userId, bookId)
    }

    @Get()
    findAll() {
        return this.service.findAll()
    }

    @Get('mine')
    findMine(@Req() req: any) {
        return this.service.findMine(req.user.userId)
    }

    @Post(':id/approve')
    approve(
        @Param('id') id: string,
        @Body('copyId') copyId: string,
        @Req() req: any
    ) {
        return this.service.approve(id, req.user.userId, copyId)
    }

    @Post(':id/reject')
    reject(
        @Param('id') id: string,
        @Body('reason') reason: string,
        @Req() req: any
    ) {
        return this.service.reject(id, req.user.userId, reason)
    }
}
