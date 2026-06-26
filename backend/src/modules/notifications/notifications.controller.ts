import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'
import { RolesGuard } from '@/common/guards/roles.guard'
import { Roles } from '@/common/decorators/roles.decorator'
import { RoleName } from '../users/entities/role.entity'
import { NotificationsService } from './notifications.service'
import { Notification } from './entities/notification.entity'

@ApiTags('Notifications - Thông báo')
@ApiBearerAuth('JWT-auth')
@Controller()
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private readonly notifService: NotificationsService) {}

    // ── Admin endpoints ──

    @Get('admin/notifications/target-counts')
    @UseGuards(RolesGuard)
    @Roles(RoleName.LIBRARY_ADMIN)
    @ApiOperation({ summary: 'Thống kê số lượng người trong từng nhóm mục tiêu' })
    getTargetCounts() {
        return this.notifService.getTargetCounts()
    }

    @Get('admin/notifications')
    @UseGuards(RolesGuard)
    @Roles(RoleName.LIBRARY_ADMIN)
    @ApiOperation({ summary: 'Lấy danh sách thông báo admin (lịch sử)' })
    list() {
        return this.notifService.list()
    }

    @Get('admin/notifications/:id')
    @UseGuards(RolesGuard)
    @Roles(RoleName.LIBRARY_ADMIN)
    @ApiOperation({ summary: 'Chi tiết thông báo theo ID' })
    findOne(@Param('id') id: string) {
        return this.notifService.findOne(id)
    }

    @Post('admin/notifications')
    @UseGuards(RolesGuard)
    @Roles(RoleName.LIBRARY_ADMIN)
    @ApiOperation({ summary: 'Tạo thông báo mới (draft hoặc gửi)' })
    @ApiBody({ schema: { example: { title: '[Bookly] Nhắc trả sách', content: 'Kính gửi {{tên_độc_giả}},...', targetGroup: 'overdue', status: 'draft' } } })
    create(@Body() dto: {
        title: string
        content: string
        targetGroup?: string
        customRecipients?: string
        variables?: string[]
        status?: 'draft' | 'sent'
    }, @Req() req: any) {
        return this.notifService.create({
            ...dto,
            createdById: req.user.userId,
        })
    }

    @Post('admin/notifications/:id/send-test')
    @UseGuards(RolesGuard)
    @Roles(RoleName.LIBRARY_ADMIN)
    @ApiOperation({ summary: 'Gửi thông báo thử nghiệm đến admin' })
    sendTest(@Param('id') id: string) {
        return this.notifService.sendTest(id)
    }

    @Patch('admin/notifications/:id/draft')
    @UseGuards(RolesGuard)
    @Roles(RoleName.LIBRARY_ADMIN)
    @ApiOperation({ summary: 'Cập nhật thông báo nháp' })
    updateDraft(@Param('id') id: string, @Body() dto: Partial<{
        title: string
        content: string
        targetGroup: string
        customRecipients: string
        variables: string[]
    }>) {
        return this.notifService.updateDraft(id, dto)
    }

    // ── Reader-facing endpoints ──

    @Get('notifications/mine')
    @ApiOperation({ summary: 'Thông báo của độc giả hiện tại' })
    getMyNotifications(@Req() req: any) {
        return this.notifService.getMyNotifications(req.user.userId)
    }

    @Get('notifications/unread-count')
    @ApiOperation({ summary: 'Số thông báo chưa đọc' })
    getUnreadCount(@Req() req: any) {
        return this.notifService.getUnreadCount(req.user.userId)
    }

    @Patch('notifications/:id/read')
    @ApiOperation({ summary: 'Đánh dấu thông báo đã đọc' })
    markAsRead(@Param('id') id: string, @Req() req: any) {
        return this.notifService.markAsRead(id, req.user.userId)
    }
}
