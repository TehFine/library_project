import { Controller, Get, Post, Body, Param, UseGuards, Req, Patch } from '@nestjs/common'
import { FinesService } from './fines.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@Controller('fines')
@UseGuards(JwtAuthGuard)
export class FinesController {
    constructor(private readonly service: FinesService) { }

    @Get()
    findAll() {
        return this.service.findAll()
    }

    @Patch(':id/pay')
    pay(@Param('id') id: string, @Body() body: { method: string }, @Req() req: any) {
        return this.service.payFine(id, req.user.userId, body.method)
    }
}
