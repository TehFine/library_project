import { Controller, Get, Post, Body, Param, UseGuards, Req, Delete } from '@nestjs/common'
import { ReservationsService } from './reservations.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@Controller('reservations')
@UseGuards(JwtAuthGuard)
export class ReservationsController {
    constructor(private readonly service: ReservationsService) { }

    @Get()
    findAll() {
        return this.service.findAll()
    }

    @Post()
    create(@Body() body: { cardId: string; bookId: string }) {
        return this.service.create(body.cardId, body.bookId)
    }

    @Delete(':id')
    cancel(@Param('id') id: string) {
        return this.service.cancel(id)
    }
}
