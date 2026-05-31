import { Controller, Get, Post, Body, Param, UseGuards, Req, Patch, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { FinesService } from './fines.service'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'

@ApiTags('Fines - Phí phạt')
@ApiBearerAuth('JWT-auth')
@Controller('fines')
@UseGuards(JwtAuthGuard)
export class FinesController {
    constructor(private readonly service: FinesService) { }

    @Get()
    @ApiOperation({ summary: 'Tất cả phí phạt', description: 'Lấy danh sách tất cả phí phạt (admin/librarian)' })
    findAll() {
        return this.service.findAll()
    }

    @Get('admin-stats')
    @ApiOperation({ summary: 'Thống kê phí', description: 'Thống kê phí phạt cho admin (dashboard + báo cáo)' })
    @ApiQuery({ name: 'from', required: false, example: '2026-01-01' })
    @ApiQuery({ name: 'to', required: false, example: '2026-06-01' })
    @ApiQuery({ name: 'status', required: false, example: 'pending', description: 'pending | paid | waived' })
    @ApiQuery({ name: 'fineType', required: false, example: 'overdue', description: 'Loại phí' })
    getAdminStats(
        @Query('from') from?: string,
        @Query('to') to?: string,
        @Query('status') status?: string,
        @Query('fineType') fineType?: string,
    ) {
        return this.service.getAdminFineStats(from, to, status, fineType)
    }

    @Get('mine')
    @ApiOperation({ summary: 'Phí của tôi', description: 'Lấy danh sách phí phạt của độc giả hiện tại' })
    findMine(@Req() req: any, @Query() query: any) {
        return this.service.findMine(req.user.userId, query)
    }

    @Patch(':id/pay')
    @ApiOperation({ summary: 'Thanh toán phí', description: 'Thanh toán một khoản phí phạt' })
    @ApiParam({ name: 'id', description: 'ID phí phạt' })
    @ApiBody({ schema: { example: { method: 'cash' } } })
    pay(@Param('id') id: string, @Body() body: { method: string }, @Req() req: any) {
        return this.service.payFine(id, req.user.userId, body.method)
    }

    @Post(':id/simulate-pay')
    @ApiOperation({ summary: 'Mô phỏng thanh toán', description: 'Độc giả tự thanh toán phí (mô phỏng)' })
    @ApiParam({ name: 'id', description: 'ID phí phạt' })
    simulatePay(@Param('id') id: string, @Req() req: any) {
        return this.service.simulatePayFine(id, req.user.userId)
    }

    @Patch(':id/waive')
    @ApiOperation({ summary: 'Xoá phí', description: 'Xoá/miễn một khoản phí phạt (librarian)' })
    @ApiParam({ name: 'id', description: 'ID phí phạt' })
    @ApiBody({ schema: { example: { reason: 'Sách bị hỏng do thư viện' } } })
    waive(@Param('id') id: string, @Body() body: { reason: string }, @Req() req: any) {
        return this.service.waiveFine(id, req.user.userId, body.reason)
    }
}


