import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ShiftsService } from './shifts.service'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'
import { RolesGuard } from '@/common/guards/roles.guard'
import { Roles } from '@/common/decorators/roles.decorator'
import { RoleName } from '../users/entities/role.entity'

@ApiTags('Shifts - Ca trực')
@ApiBearerAuth('JWT-auth')
@Controller('shifts')
@UseGuards(JwtAuthGuard)
export class ShiftsController {
    constructor(private readonly service: ShiftsService) { }

    @Post()
    @UseGuards(RolesGuard)
    @Roles(RoleName.LIBRARY_ADMIN)
    @ApiOperation({ summary: 'Tạo ca trực', description: 'Admin tạo ca trực cho thủ thư' })
    create(@Body() dto: { librarianId: string; startTime: string; endTime: string; note?: string }) {
        return this.service.create(dto)
    }

    @Get()
    @UseGuards(RolesGuard)
    @Roles(RoleName.LIBRARY_ADMIN)
    @ApiOperation({ summary: 'Tất cả ca trực', description: 'Admin xem tất cả ca trực' })
    findAll() {
        return this.service.findAll()
    }

    @Get('mine')
    @ApiOperation({ summary: 'Ca của tôi', description: 'Thủ thư xem lịch sử ca trực của mình' })
    findMine(@Req() req: any) {
        return this.service.findMine(req.user.userId)
    }

    @Get('current')
    @ApiOperation({ summary: 'Ca hiện tại', description: 'Kiểm tra thủ thư có đang trong ca không' })
    async current(@Req() req: any) {
        const onShift = await this.service.isOnShift(req.user.userId)
        return { onShift }
    }

    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles(RoleName.LIBRARY_ADMIN)
    @ApiOperation({ summary: 'Xoá ca trực', description: 'Admin xoá ca trực' })
    delete(@Param('id') id: string) {
        return this.service.deleteShift(id)
    }
}
