import { Controller, Get, Post, Body, Param, UseGuards, Req, Delete, Query } from '@nestjs/common'
import { ReservationsService } from './reservations.service'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'

@Controller('reservations')
@UseGuards(JwtAuthGuard)
export class ReservationsController {
    constructor(private readonly service: ReservationsService) { }

    @Get()
    findAll() {
        return this.service.findAll()
    }

    @Get('mine')
    findMine(@Req() req: any, @Query() query: any) {
        return this.service.findMine(req.user.userId, query)
    }

    @Post()
    create(@Req() req: any, @Body() body: { bookId: string }) {
        return this.service.create(req.user.userId, body.bookId)
    }

    @Post(':id/cancel')
    cancel(@Param('id') id: string) {
        return this.service.cancel(id)
    }

    @Post(':id/notify')
    notify(@Param('id') id: string) {
        return this.service.notify(id)
    }

    @Post(':id/fulfill')
    fulfill(@Param('id') id: string, @Req() req: any) {
        return this.service.fulfill(id, req.user.userId)
    }

    @Delete(':id')
    delete(@Param('id') id: string) {
        return this.service.cancel(id)
    }
}

