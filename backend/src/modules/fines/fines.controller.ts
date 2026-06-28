import { Controller, Get, Post, Body, Param, UseGuards, Req, Patch, Query, Res, NotFoundException, BadRequestException } from '@nestjs/common'
import { Response } from 'express'
import { ApiBearerAuth, ApiBody, ApiExcludeEndpoint, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { FinesService } from './fines.service'
import { VnpayService } from './vnpay.service'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'
import { RolesGuard } from '@/common/guards/roles.guard'
import { ShiftGuard, OnShift } from '@/common/guards/shift.guard'
import { Roles, Public } from '@/common/decorators/roles.decorator'
import { RoleName } from '../users/entities/role.entity'

@ApiTags('Fines - Phí phạt')
@ApiBearerAuth('JWT-auth')
@Controller('fines')
@UseGuards(JwtAuthGuard)
export class FinesController {
    constructor(
        private readonly service: FinesService,
        private readonly vnpayService: VnpayService,
    ) { }

    @Get()
    @UseGuards(RolesGuard, ShiftGuard)
    @Roles(RoleName.LIBRARIAN, RoleName.LIBRARY_ADMIN)
    @OnShift()
    @ApiOperation({ summary: 'Tất cả phí phạt', description: 'Lấy danh sách tất cả phí phạt (admin/librarian)' })
    findAll() {
        return this.service.findAll()
    }

    @Get('admin-stats')
    @UseGuards(RolesGuard)
    @Roles(RoleName.LIBRARY_ADMIN)
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
    @UseGuards(RolesGuard, ShiftGuard)
    @Roles(RoleName.LIBRARIAN, RoleName.LIBRARY_ADMIN)
    @OnShift()
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
    @UseGuards(RolesGuard, ShiftGuard)
    @Roles(RoleName.LIBRARIAN, RoleName.LIBRARY_ADMIN)
    @OnShift()
    @ApiOperation({ summary: 'Xoá phí', description: 'Xoá/miễn một khoản phí phạt (librarian)' })
    @ApiParam({ name: 'id', description: 'ID phí phạt' })
    @ApiBody({ schema: { example: { reason: 'Sách bị hỏng do thư viện' } } })
    waive(@Param('id') id: string, @Body() body: { reason: string }, @Req() req: any) {
        return this.service.waiveFine(id, req.user.userId, body.reason)
    }

    // ── VNPay endpoints ──────────────────────────────────────────────────────

    @Post(':id/vnpay-pay')
    @ApiOperation({ summary: 'Thanh toán VNPay', description: 'Tạo URL thanh toán VNPay cho khoản phí phạt' })
    @ApiParam({ name: 'id', description: 'ID phí phạt' })
    async vnpayPay(@Param('id') id: string, @Req() req: any) {
        const fine = await this.service.getFineById(id)
        if (!fine) throw new NotFoundException('Không tìm thấy khoản phí')
        if (fine.status !== 'pending') throw new BadRequestException('Khoản phí này đã được xử lý')
        if (fine.borrowRecord?.libraryCard?.userId !== req.user.userId) {
            throw new BadRequestException('Bạn không có quyền thanh toán khoản phí này')
        }

        const ipAddr = req.ip || req.connection?.remoteAddress || '127.0.0.1'
        const paymentUrl = this.vnpayService.createPaymentUrl(id, Number(fine.amount), ipAddr)

        return { paymentUrl }
    }

    @Public()
    @Get('vnpay-return')
    @ApiExcludeEndpoint()
    async vnpayReturn(@Query() query: any, @Res() res: Response) {
        const result = await this.vnpayService.handleReturn(query)
        
        const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000'
        if (result.isSuccess && result.fineId) {
            return res.redirect(`${frontendUrl}/reader/fines?vnpay=success&fineId=${result.fineId}`)
        } else {
            const failQuery = `vnpay=fail&message=${encodeURIComponent(result.message)}${result.fineId ? `&fineId=${result.fineId}` : ''}`
            return res.redirect(`${frontendUrl}/reader/fines?${failQuery}`)
        }
    }
}


