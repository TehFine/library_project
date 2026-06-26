import { Controller, Get, Post, Body, Param, UseGuards, Req, Patch } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { BorrowRequestsService } from './borrow-requests.service'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'
import { RolesGuard } from '@/common/guards/roles.guard'
import { Roles } from '@/common/decorators/roles.decorator'
import { RoleName } from '../users/entities/role.entity'

@ApiTags('Borrow Requests - Yêu cầu mượn')
@ApiBearerAuth('JWT-auth')
@Controller('borrow-requests')
@UseGuards(JwtAuthGuard)
export class BorrowRequestsController {
    constructor(private readonly service: BorrowRequestsService) { }

    @Post()
    @ApiOperation({ summary: 'Tạo yêu cầu mượn', description: 'Độc giả tạo yêu cầu mượn sách (chờ thủ thư duyệt)' })
    @ApiBody({ schema: { example: { bookId: 'c0000000-...' } } })
    @ApiResponse({ status: 201, description: 'Yêu cầu mượn đã được tạo' })
    create(@Body('bookId') bookId: string, @Req() req: any) {
        return this.service.create(req.user.userId, bookId)
    }

    @Get()
    @UseGuards(RolesGuard)
    @Roles(RoleName.LIBRARIAN, RoleName.LIBRARY_ADMIN)
    @ApiOperation({ summary: 'Tất cả yêu cầu', description: 'Lấy danh sách tất cả yêu cầu mượn (librarian)' })
    findAll() {
        return this.service.findAll()
    }

    @Get('mine')
    @ApiOperation({ summary: 'Yêu cầu của tôi', description: 'Lấy danh sách yêu cầu mượn của độc giả hiện tại' })
    findMine(@Req() req: any) {
        return this.service.findMine(req.user.userId)
    }

    @Post(':id/approve')
    @UseGuards(RolesGuard)
    @Roles(RoleName.LIBRARIAN, RoleName.LIBRARY_ADMIN)
    @ApiOperation({ summary: 'Duyệt yêu cầu', description: 'Thủ thư duyệt yêu cầu mượn và chọn bản sao' })
    @ApiParam({ name: 'id', description: 'ID yêu cầu mượn' })
    @ApiBody({ schema: { example: { copyId: 'uuid-copy-id' } } })
    approve(
        @Param('id') id: string,
        @Body('copyId') copyId: string,
        @Req() req: any
    ) {
        return this.service.approve(id, req.user.userId, copyId)
    }

    @Post(':id/reject')
    @UseGuards(RolesGuard)
    @Roles(RoleName.LIBRARIAN, RoleName.LIBRARY_ADMIN)
    @ApiOperation({ summary: 'Từ chối yêu cầu', description: 'Thủ thư từ chối yêu cầu mượn kèm lý do' })
    @ApiParam({ name: 'id', description: 'ID yêu cầu mượn' })
    @ApiBody({ schema: { example: { reason: 'Sách không có sẵn' } } })
    reject(
        @Param('id') id: string,
        @Body('reason') reason: string,
        @Req() req: any
    ) {
        return this.service.reject(id, req.user.userId, reason)
    }
}
