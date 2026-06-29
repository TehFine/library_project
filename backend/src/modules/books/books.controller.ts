import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { BooksService } from './books.service'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'
import { RolesGuard } from '@/common/guards/roles.guard'
import { ShiftGuard, OnShift } from '@/common/guards/shift.guard'
import { Roles } from '@/common/decorators/roles.decorator'
import { RoleName } from '../users/entities/role.entity'

@ApiTags('Books - Sách')
@Controller('books')
export class BooksController {
    constructor(private readonly booksService: BooksService) { }

    @Get()
    @ApiOperation({ summary: 'Danh sách sách', description: 'Lấy danh sách sách với phân trang, tìm kiếm và lọc' })
    @ApiQuery({ name: 'page', required: false, example: '1', description: 'Trang số' })
    @ApiQuery({ name: 'limit', required: false, example: '12', description: 'Số lượng mỗi trang' })
    @ApiQuery({ name: 'search', required: false, example: 'Đắc Nhân Tâm', description: 'Tìm kiếm theo tiêu đề' })
    @ApiQuery({ name: 'categoryId', required: false, example: '2', description: 'Lọc theo thể loại' })
    @ApiQuery({ name: 'available', required: false, example: 'true', description: 'Lọc sách còn bản sao có sẵn' })
    @ApiResponse({ status: 200, description: 'Danh sách sách (phân trang)' })
    findAll(
        @Query('page')       page?: string,
        @Query('limit')      limit?: string,
        @Query('search')     search?: string,
        @Query('categoryId') categoryId?: string,
        @Query('available')  available?: string,
    ) {
        return this.booksService.findAll({
            page:       page       ? parseInt(page)       : undefined,
            limit:      limit      ? parseInt(limit)      : undefined,
            search:     search     || undefined,
            categoryId: categoryId ? parseInt(categoryId) : undefined,
            available:  available  === '1' || available === 'true',
        })
    }

    @Get(':id')
    @ApiOperation({ summary: 'Chi tiết sách', description: 'Lấy thông tin chi tiết của một cuốn sách' })
    @ApiParam({ name: 'id', description: 'ID của sách', example: 'c0000000-0000-4000-8000-000000000001' })
    @ApiResponse({ status: 200, description: 'Thông tin sách' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy sách' })
    findOne(@Param('id') id: string) {
        return this.booksService.findOne(id)
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard, ShiftGuard)
    @Roles(RoleName.LIBRARIAN, RoleName.LIBRARY_ADMIN)
    @OnShift()
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Thêm sách mới', description: 'Thêm một cuốn sách mới vào thư viện' })
    @ApiBody({ schema: { example: { title: 'Tên sách', author: 'Tác giả', isbn: '978-604-2-18901-3', categoryId: 1, publisher: 'NXB', publishYear: 2024, description: 'Mô tả', totalCopies: 5 } } })
    @ApiResponse({ status: 201, description: 'Sách đã được tạo' })
    create(@Body() dto: any, @Req() req: any) {
        return this.booksService.create(dto, req.user.userId)
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard, ShiftGuard)
    @Roles(RoleName.LIBRARIAN, RoleName.LIBRARY_ADMIN)
    @OnShift()
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Cập nhật sách', description: 'Cập nhật thông tin sách' })
    @ApiParam({ name: 'id', description: 'ID của sách' })
    @ApiResponse({ status: 200, description: 'Sách đã được cập nhật' })
    update(@Param('id') id: string, @Body() dto: any) {
        return this.booksService.update(id, dto)
    }

    @Post(':id/copies')
    @UseGuards(JwtAuthGuard, RolesGuard, ShiftGuard)
    @Roles(RoleName.LIBRARIAN, RoleName.LIBRARY_ADMIN)
    @OnShift()
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Thêm bản sao', description: 'Thêm bản sao mới cho một cuốn sách' })
    @ApiParam({ name: 'id', description: 'ID của sách' })
    @ApiBody({ schema: { example: { copyCode: '001', condition: 'new' } } })
    createCopy(@Param('id') id: string, @Body() dto: any) {
        return this.booksService.createCopy(id, dto)
    }

    @Patch('copies/:id')
    @UseGuards(JwtAuthGuard, RolesGuard, ShiftGuard)
    @Roles(RoleName.LIBRARIAN, RoleName.LIBRARY_ADMIN)
    @OnShift()
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Cập nhật bản sao', description: 'Cập nhật thông tin bản sao' })
    @ApiParam({ name: 'id', description: 'ID của bản sao' })
    updateCopy(@Param('id') id: string, @Body() dto: any) {
        return this.booksService.updateCopy(id, dto)
    }

    @Delete('copies/:id')
    @UseGuards(JwtAuthGuard, RolesGuard, ShiftGuard)
    @Roles(RoleName.LIBRARIAN, RoleName.LIBRARY_ADMIN)
    @OnShift()
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Xoá bản sao', description: 'Xoá một bản sao sách' })
    @ApiParam({ name: 'id', description: 'ID của bản sao' })
    @ApiResponse({ status: 200, description: 'Bản sao đã được xoá' })
    removeCopy(@Param('id') id: string) {
        return this.booksService.removeCopy(id)
    }

    @Get('copies/search')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleName.LIBRARIAN, RoleName.LIBRARY_ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Tìm kiếm bản sao', description: 'Tìm kiếm bản sao sách theo mã' })
    @ApiQuery({ name: 'q', required: true, example: '001', description: 'Mã bản sao cần tìm' })
    searchCopies(@Query('q') q: string) {
        return this.booksService.searchCopies(q)
    }

    @Get('copies/:code')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleName.LIBRARIAN, RoleName.LIBRARY_ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Tra cứu bản sao', description: 'Tra cứu bản sao theo mã vạch' })
    @ApiParam({ name: 'code', description: 'Mã vạch bản sao', example: '901-001' })
    findCopyByCode(@Param('code') code: string) {
        return this.booksService.findCopyByCode(code)
    }

    @Get(':id/available-copies')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleName.LIBRARIAN, RoleName.LIBRARY_ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Bản sao có sẵn', description: 'Lấy danh sách bản sao còn có sẵn để mượn của một sách' })
    @ApiParam({ name: 'id', description: 'ID của sách' })
    getAvailableCopies(@Param('id') id: string) {
        return this.booksService.getAvailableCopies(id)
    }
}

