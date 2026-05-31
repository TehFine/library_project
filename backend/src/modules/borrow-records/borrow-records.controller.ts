import { Controller, Get, Post, Body, Param, UseGuards, Req, Patch, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { BorrowRecordsService } from './borrow-records.service'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'

@ApiTags('Borrow Records - Mượn/Trả sách')
@ApiBearerAuth('JWT-auth')
@Controller('borrow-records')
@UseGuards(JwtAuthGuard)
export class BorrowRecordsController {
    constructor(private readonly service: BorrowRecordsService) { }

    @Get()
    @ApiOperation({ summary: 'Tất cả phiếu mượn', description: 'Lấy danh sách tất cả phiếu mượn (librarian/admin)' })
    findAll() {
        return this.service.findAll()
    }

    @Get('copy/:code')
    @ApiOperation({ summary: 'Tra cứu theo bản sao', description: 'Tìm phiếu mượn theo mã bản sao' })
    @ApiParam({ name: 'code', description: 'Mã bản sao', example: '901-001' })
    findByCopyCode(@Param('code') code: string) {
        return this.service.findByCopyCode(code)
    }

    @Get('by-card/:cardNumber')
    @ApiOperation({ summary: 'Tra cứu theo thẻ', description: 'Tìm phiếu mượn theo số thẻ thư viện' })
    @ApiParam({ name: 'cardNumber', description: 'Số thẻ thư viện', example: 'TV-2024-001' })
    findByCardNumber(@Param('cardNumber') cardNumber: string) {
        return this.service.findByCardNumber(cardNumber)
    }

    @Get('mine')
    @ApiOperation({ summary: 'Phiếu mượn của tôi', description: 'Lấy danh sách phiếu mượn của độc giả hiện tại' })
    @ApiQuery({ name: 'status', required: false, example: 'borrowing', description: 'Lọc theo trạng thái' })
    @ApiQuery({ name: 'page', required: false, example: '1' })
    @ApiQuery({ name: 'limit', required: false, example: '12' })
    findMine(@Req() req: any, @Query() query: any) {
        return this.service.findMine(req.user.userId, query)
    }

    @Post()
    @ApiOperation({ summary: 'Tạo phiếu mượn', description: 'Tạo phiếu mượn sách cho độc giả (librarian). Kiểm tra ràng buộc trùng sách và MAX_BORROW.' })
    @ApiBody({ schema: { example: { cardId: 'b0000000-...', copyId: 'uuid-copy-id', requestId: 'uuid-request-id (tuỳ chọn)' } } })
    @ApiResponse({ status: 201, description: 'Phiếu mượn đã được tạo' })
    @ApiResponse({ status: 400, description: 'Lỗi: sách không có sẵn, trùng sách, hoặc vượt quá MAX_BORROW' })
    borrow(@Body() dto: { cardId: string; copyId: string; requestId?: string }, @Req() req: any) {
        return this.service.borrow(dto, req.user.userId)
    }

    @Patch(':id/return')
    @ApiOperation({ summary: 'Trả sách', description: 'Xác nhận trả sách, cập nhật tình trạng, tính phí phạt nếu quá hạn' })
    @ApiParam({ name: 'id', description: 'ID phiếu mượn' })
    @ApiBody({ schema: { example: { condition: 'good', paymentMethod: 'cash' } } })
    returnBook(@Param('id') id: string, @Body() body: { condition: string; paymentMethod?: string }, @Req() req: any) {
        return this.service.returnBook(id, body.condition, body.paymentMethod, req.user.userId)
    }

    @Get('search-by-book-title')
    @ApiOperation({ summary: 'Tìm theo tên sách', description: 'Tìm phiếu mượn đang active theo tên sách' })
    @ApiQuery({ name: 'q', required: false, example: 'Đắc Nhân Tâm' })
    searchByBookTitle(@Query('q') q: string) {
        return this.service.searchByBookTitle(q || '')
    }

    @Get('pending-returns')
    @ApiOperation({ summary: 'Yêu cầu trả', description: 'Danh sách phiếu mượn đang chờ xác nhận trả' })
    pendingReturns() {
        return this.service.findPendingReturns()
    }

    @Post(':id/request-return')
    @ApiOperation({ summary: 'Yêu cầu trả sách', description: 'Độc giả yêu cầu trả sách (chờ thủ thư xác nhận)' })
    @ApiParam({ name: 'id', description: 'ID phiếu mượn' })
    requestReturn(@Param('id') id: string, @Req() req: any) {
        return this.service.requestReturn(id, req.user.userId)
    }

    @Post(':id/approve-return')
    @ApiOperation({ summary: 'Duyệt yêu cầu trả', description: 'Thủ thư duyệt yêu cầu trả sách từ độc giả' })
    @ApiParam({ name: 'id', description: 'ID phiếu mượn' })
    @ApiBody({ schema: { example: { condition: 'good' } } })
    approveReturn(@Param('id') id: string, @Body() body: { condition: string }, @Req() req: any) {
        return this.service.approveReturn(id, req.user.userId, body.condition)
    }

    @Post(':id/simulate-return')
    @ApiOperation({ summary: 'Tự động trả', description: 'Độc giả tự động trả sách (mô phỏng, condition="good")' })
    @ApiParam({ name: 'id', description: 'ID phiếu mượn' })
    simulateReturn(@Param('id') id: string, @Req() req: any) {
        return this.service.simulateReturn(id, req.user.userId)
    }

    @Post(':id/renew')
    @ApiOperation({ summary: 'Gia hạn sách', description: 'Gia hạn sách đang mượn (tối đa 2 lần, mỗi lần 14 ngày)' })
    @ApiParam({ name: 'id', description: 'ID phiếu mượn' })
    @ApiResponse({ status: 201, description: 'Gia hạn thành công' })
    @ApiResponse({ status: 400, description: 'Quá số lần gia hạn' })
    renew(@Param('id') id: string, @Req() req: any) {
        return this.service.renew(id, req.user.userId)
    }
}

