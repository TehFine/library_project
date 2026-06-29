import { Controller, Get, UseGuards, Req } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'
import { RolesGuard } from '@/common/guards/roles.guard'
import { ShiftGuard } from '@/common/guards/shift.guard'
import { Roles } from '@/common/decorators/roles.decorator'
import { RoleName } from '../users/entities/role.entity'
import { LibrarianService } from './librarian.service'

@ApiTags('Librarian - Thủ thư')
@ApiBearerAuth('JWT-auth')
@Controller('librarian')
@UseGuards(JwtAuthGuard, RolesGuard, ShiftGuard)
@Roles(RoleName.LIBRARIAN, RoleName.LIBRARY_ADMIN)
export class LibrarianController {
    constructor(private readonly librarianService: LibrarianService) { }

    @Get('dashboard/stats')
    @ApiOperation({ summary: 'Dashboard thủ thư', description: 'Lấy thống kê tổng quan cho dashboard của thủ thư' })
    getStats(@Req() req: any) {
        // Nếu là admin (LIBRARY_ADMIN), xem tổng; nếu là librarian, chỉ xem của mình
        return this.librarianService.getStats(req.user.userId)
    }

    @Get('borrow-requests/pending-count')
    @ApiOperation({ summary: 'Số yêu cầu chờ', description: 'Lấy số lượng yêu cầu mượn đang chờ duyệt' })
    getPendingRequestsCount() {
        return this.librarianService.getPendingRequestsCount()
    }
}
