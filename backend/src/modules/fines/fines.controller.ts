import { Controller, Get, Post, Body, Param, UseGuards, Req, Patch, Query } from '@nestjs/common'
import { FinesService } from './fines.service'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'

@Controller('fines')
@UseGuards(JwtAuthGuard)
export class FinesController {
    constructor(private readonly service: FinesService) { }

    @Get()
    findAll() {
        return this.service.findAll()
    }

    @Get('admin-stats')
    getAdminStats(
        @Query('from') from?: string,
        @Query('to') to?: string,
        @Query('status') status?: string,
        @Query('fineType') fineType?: string,
    ) {
        return this.service.getAdminFineStats(from, to, status, fineType)
    }

    @Get('mine')
    findMine(@Req() req: any, @Query() query: any) {
        return this.service.findMine(req.user.userId, query)
    }

    @Patch(':id/pay')
    pay(@Param('id') id: string, @Body() body: { method: string }, @Req() req: any) {
        return this.service.payFine(id, req.user.userId, body.method)
    }

    @Post(':id/simulate-pay')
    simulatePay(@Param('id') id: string, @Req() req: any) {
        return this.service.simulatePayFine(id, req.user.userId)
    }

    @Patch(':id/waive')
    waive(@Param('id') id: string, @Body() body: { reason: string }, @Req() req: any) {
        return this.service.waiveFine(id, req.user.userId, body.reason)
    }
}


