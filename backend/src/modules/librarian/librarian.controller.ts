import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'
import { LibrarianService } from './librarian.service'

@ApiTags('Librarian - Thủ thư')
@ApiBearerAuth('JWT-auth')
@Controller('librarian')
@UseGuards(JwtAuthGuard)
export class LibrarianController {
    constructor(private readonly librarianService: LibrarianService) { }

    @Get('dashboard/stats')
    @ApiOperation({ summary: 'Dashboard thủ thư', description: 'Lấy thống kê tổng quan cho dashboard của thủ thư' })
    getStats() {
        return this.librarianService.getStats()
    }

    @Get('borrow-requests/pending-count')
    @ApiOperation({ summary: 'Số yêu cầu chờ', description: 'Lấy số lượng yêu cầu mượn đang chờ duyệt' })
    getPendingRequestsCount() {
        return this.librarianService.getPendingRequestsCount()
    }
}
