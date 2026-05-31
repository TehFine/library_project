import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RoleName } from '../users/entities/role.entity';
import { AdminService } from './admin.service';

@ApiTags('Admin - Quản trị')
@ApiBearerAuth('JWT-auth')
@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    @Get('dashboard/stats')
    @ApiOperation({ summary: 'Thống kê dashboard (số sách, lượt mượn, người dùng)' })
    getDashboardStats() {
        return this.adminService.getDashboardStats();
    }

    @Get('reports/books')
    @ApiOperation({ summary: 'Báo cáo sách' })
    getBookReports() {
        return this.adminService.getBookReports();
    }

    @Get('audit-logs')
    @ApiOperation({ summary: 'Nhật ký hệ thống' })
    getAuditLogs() {
        return this.adminService.getAuditLogs();
    }

    @Get('reports/violations')
    @ApiOperation({ summary: 'Báo cáo vi phạm' })
    getViolationReports() {
        return this.adminService.getViolationReports();
    }

    @Get('users')
    @ApiOperation({ summary: 'Danh sách người dùng' })
    getAllUsers() {
        return this.adminService.getAllUsers();
    }

    @Patch('users/:id/role')
    @ApiOperation({ summary: 'Cập nhật vai trò người dùng' })
    @ApiBody({ schema: { example: { role: 'librarian' } } })
    updateUserRole(@Param('id') id: string, @Body('role') role: RoleName) {
        return this.adminService.updateUserRole(id, role);
    }

    @Patch('users/:id/status')
    @ApiOperation({ summary: 'Kích hoạt/vô hiệu hoá người dùng' })
    @ApiBody({ schema: { example: { isActive: false } } })
    toggleUserStatus(@Param('id') id: string, @Body('isActive') isActive: boolean) {
        return this.adminService.toggleUserStatus(id, isActive);
    }
}
