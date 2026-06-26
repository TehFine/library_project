import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { LibraryCardsService } from './library-cards.service'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'
import { RolesGuard } from '@/common/guards/roles.guard'
import { Roles } from '@/common/decorators/roles.decorator'
import { RoleName } from '../users/entities/role.entity'

@ApiTags('Library Cards - Thẻ thư viện')
@ApiBearerAuth('JWT-auth')
@Controller('library-cards')
@UseGuards(JwtAuthGuard)
export class LibraryCardsController {
    constructor(private readonly service: LibraryCardsService) { }

    @Get()
    @UseGuards(RolesGuard)
    @Roles(RoleName.LIBRARIAN, RoleName.LIBRARY_ADMIN)
    @ApiOperation({ summary: 'Tất cả thẻ', description: 'Lấy danh sách tất cả thẻ thư viện' })
    findAll() {
        return this.service.findAll()
    }

    @Get('search')
    @UseGuards(RolesGuard)
    @Roles(RoleName.LIBRARIAN, RoleName.LIBRARY_ADMIN)
    @ApiOperation({ summary: 'Tìm kiếm thẻ', description: 'Tìm kiếm thẻ thư viện theo từ khoá' })
    @ApiQuery({ name: 'q', required: true, example: 'TV-2024', description: 'Từ khoá tìm kiếm' })
    search(@Query('q') q: string) {
        return this.service.search(q)
    }

    @Get('mine')
    @ApiOperation({ summary: 'Thẻ của tôi', description: 'Lấy thông tin thẻ thư viện của độc giả hiện tại' })
    findMine(@Req() req: any) {
        return this.service.findMine(req.user.userId)
    }

    @Get('pending-activations')
    @UseGuards(RolesGuard)
    @Roles(RoleName.LIBRARIAN, RoleName.LIBRARY_ADMIN)
    @ApiOperation({ summary: 'Yêu cầu kích hoạt', description: 'Danh sách thẻ chờ kích hoạt (librarian)' })
    getPendingActivations() {
        return this.service.getPendingActivations()
    }

    @Get('by-number/:cardNumber')
    @UseGuards(RolesGuard)
    @Roles(RoleName.LIBRARIAN, RoleName.LIBRARY_ADMIN)
    @ApiOperation({ summary: 'Tra cứu theo số thẻ', description: 'Tìm thẻ thư viện theo số thẻ' })
    @ApiParam({ name: 'cardNumber', description: 'Số thẻ thư viện', example: 'TV-2024-001' })
    findByCardNumber(@Param('cardNumber') cardNumber: string) {
        return this.service.findByCardNumber(cardNumber)
    }

    @Get(':id')
    @UseGuards(RolesGuard)
    @Roles(RoleName.LIBRARIAN, RoleName.LIBRARY_ADMIN)
    @ApiOperation({ summary: 'Chi tiết thẻ', description: 'Lấy thông tin chi tiết của một thẻ thư viện' })
    @ApiParam({ name: 'id', description: 'ID thẻ thư viện' })
    findById(@Param('id') id: string) {
        return this.service.findByIdWithDetails(id)
    }

    @Post()
    @UseGuards(RolesGuard)
    @Roles(RoleName.LIBRARIAN, RoleName.LIBRARY_ADMIN)
    @ApiOperation({ summary: 'Cấp thẻ mới', description: 'Tạo thẻ thư viện mới cho độc giả (librarian)' })
    @ApiBody({ schema: { example: { userId: 'user-uuid', duration: '1y' } } })
    create(@Body() body: any, @Req() req: any) {
        return this.service.create(body, req.user.userId)
    }

    @Patch(':id/renew')
    @UseGuards(RolesGuard)
    @Roles(RoleName.LIBRARIAN, RoleName.LIBRARY_ADMIN)
    @ApiOperation({ summary: 'Gia hạn thẻ', description: 'Gia hạn thẻ thư viện' })
    @ApiParam({ name: 'id', description: 'ID thẻ thư viện' })
    @ApiBody({ schema: { example: { duration: '1y' } } })
    renew(@Param('id') id: string, @Body('duration') duration: string) {
        return this.service.renew(id, duration)
    }

    @Post('request-activation')
    @ApiOperation({ summary: 'Yêu cầu kích hoạt thẻ', description: 'Độc giả yêu cầu kích hoạt thẻ thư viện' })
    requestActivation(@Req() req: any) {
        return this.service.requestActivation(req.user.userId)
    }

    @Patch(':id/approve-activation')
    @UseGuards(RolesGuard)
    @Roles(RoleName.LIBRARIAN, RoleName.LIBRARY_ADMIN)
    @ApiOperation({ summary: 'Duyệt kích hoạt thẻ', description: 'Thủ thư duyệt yêu cầu kích hoạt thẻ' })
    @ApiParam({ name: 'id', description: 'ID thẻ thư viện' })
    approveActivation(@Param('id') id: string, @Req() req: any) {
        return this.service.approveActivation(id, req.user.userId)
    }

    @Patch(':id/reject-activation')
    @UseGuards(RolesGuard)
    @Roles(RoleName.LIBRARIAN, RoleName.LIBRARY_ADMIN)
    @ApiOperation({ summary: 'Từ chối kích hoạt thẻ', description: 'Thủ thư từ chối yêu cầu kích hoạt thẻ' })
    @ApiParam({ name: 'id', description: 'ID thẻ thư viện' })
    rejectActivation(@Param('id') id: string, @Req() req: any) {
        return this.service.rejectActivation(id, req.user.userId)
    }
}

