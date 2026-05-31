import { Controller, Get, Post, Body, Param, UseGuards, Req, Delete, Query } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiBody } from '@nestjs/swagger'
import { ReservationsService } from './reservations.service'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'

@ApiTags('Reservations - Đặt chỗ sách')
@ApiBearerAuth('JWT-auth')
@Controller('reservations')
@UseGuards(JwtAuthGuard)
export class ReservationsController {
    constructor(private readonly service: ReservationsService) { }

    @Get()
    @ApiOperation({ summary: 'Tất cả đặt chỗ (admin/thủ thư)' })
    findAll() {
        return this.service.findAll()
    }

    @Get('mine')
    @ApiOperation({ summary: 'Đặt chỗ của tôi' })
    findMine(@Req() req: any, @Query() query: any) {
        return this.service.findMine(req.user.userId, query)
    }

    @Post()
    @ApiOperation({ summary: 'Tạo đặt chỗ cho sách' })
    @ApiBody({ schema: { example: { bookId: 'uuid' } } })
    create(@Req() req: any, @Body() body: { bookId: string }) {
        return this.service.create(req.user.userId, body.bookId)
    }

    @Post(':id/cancel')
    @ApiOperation({ summary: 'Huỷ đặt chỗ' })
    cancel(@Param('id') id: string) {
        return this.service.cancel(id)
    }

    @Post(':id/notify')
    @ApiOperation({ summary: 'Thông báo sách đã sẵn sàng cho độc giả' })
    notify(@Param('id') id: string) {
        return this.service.notify(id)
    }

    @Post(':id/fulfill')
    @ApiOperation({ summary: 'Hoàn thành đặt chỗ (thủ thư xác nhận đã lấy sách)' })
    fulfill(@Param('id') id: string, @Req() req: any) {
        return this.service.fulfill(id, req.user.userId)
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Xoá/huỷ đặt chỗ' })
    delete(@Param('id') id: string) {
        return this.service.cancel(id)
    }
}
