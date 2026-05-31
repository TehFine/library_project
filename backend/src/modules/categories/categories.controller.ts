import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { CategoriesService } from './categories.service'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'

@ApiTags('Categories - Thể loại')
@Controller('categories')
export class CategoriesController {
    constructor(private readonly service: CategoriesService) { }

    @Get()
    @ApiOperation({ summary: 'Danh sách thể loại', description: 'Lấy danh sách tất cả thể loại sách' })
    findAll() {
        return this.service.findAll()
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Thêm thể loại', description: 'Thêm thể loại sách mới' })
    @ApiBody({ schema: { example: { name: 'Khoa học viễn tưởng' } } })
    create(@Body('name') name: string) {
        return this.service.create(name)
    }
}

