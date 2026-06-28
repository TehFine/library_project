import { Controller, Get, Post, Patch, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { RoleName } from '../users/entities/role.entity';
import { AdminService } from './admin.service';

@ApiTags('Admin - Quản trị')
@ApiBearerAuth('JWT-auth')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.LIBRARY_ADMIN)
export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    @Get('dashboard/stats')
    @ApiOperation({ summary: 'Thống kê dashboard (số sách, lượt mượn, người dùng)' })
    getDashboardStats() {
        return this.adminService.getDashboardStats();
    }

    @Get('reports/books')
    @ApiOperation({ summary: 'Báo cáo sách' })
    @ApiQuery({ name: 'fromDate', required: false, description: 'Lọc từ ngày (YYYY-MM-DD)' })
    @ApiQuery({ name: 'toDate', required: false, description: 'Lọc đến ngày (YYYY-MM-DD)' })
    @ApiQuery({ name: 'categoryId', required: false, description: 'Lọc theo thể loại' })
    @ApiQuery({ name: 'search', required: false, description: 'Tìm kiếm theo tên sách hoặc tác giả' })
    getBookReports(
        @Query('fromDate') fromDate?: string,
        @Query('toDate') toDate?: string,
        @Query('categoryId') categoryId?: string,
        @Query('search') search?: string,
    ) {
        return this.adminService.getBookReports({ fromDate, toDate, categoryId, search });
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
    @ApiBody({ schema: { example: { isActive: false, reason: 'Vi phạm chính sách mượn sách nhiều lần' } } })
    toggleUserStatus(
        @Param('id') id: string,
        @Body('isActive') isActive: boolean,
        @Body('reason') reason?: string,
    ) {
        return this.adminService.toggleUserStatus(id, isActive, reason);
    }

    @Get('settings')
    @ApiOperation({ summary: 'Lấy cấu hình hệ thống' })
    getSettings() {
        return this.adminService.getSettings();
    }

    @Put('settings')
    @ApiOperation({ summary: 'Cập nhật cấu hình hệ thống' })
    @ApiBody({ schema: { example: { fineFirst5Days: '1000', fineFromDay6: '3000', maxBooksPerBorrow: '3' } } })
    updateSettings(@Body() body: Record<string, string>) {
        return this.adminService.updateSettings(body);
    }

    // ── Task management ─────────────────────────────────────────────────
    @Get('system-tasks')
    @ApiOperation({ summary: 'Danh sách tác vụ tự động' })
    getSystemTasks() {
        return this.adminService.getSystemTasks();
    }

    @Patch('system-tasks/:id/toggle')
    @ApiOperation({ summary: 'Bật/tắt tác vụ tự động' })
    @ApiBody({ schema: { example: { enabled: false } } })
    toggleSystemTask(@Param('id') id: string, @Body('enabled') enabled: boolean) {
        return this.adminService.toggleSystemTask(id, enabled);
    }

    @Post('system-tasks/:id/run-now')
    @ApiOperation({ summary: 'Chạy tác vụ ngay lập tức' })
    runSystemTask(@Param('id') id: string) {
        return this.adminService.runSystemTask(id);
    }
}
