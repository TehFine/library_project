import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req } from '@nestjs/common'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'
import { NotificationsService } from './notifications.service'
import { Notification } from './entities/notification.entity'

@Controller()
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private readonly notifService: NotificationsService) {}

    // ── Admin endpoints ──

    @Get('admin/notifications/target-counts')
    getTargetCounts() {
        return this.notifService.getTargetCounts()
    }

    @Get('admin/notifications')
    list() {
        return this.notifService.list()
    }

    @Get('admin/notifications/:id')
    findOne(@Param('id') id: string) {
        return this.notifService.findOne(id)
    }

    @Post('admin/notifications')
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
    sendTest(@Param('id') id: string) {
        return this.notifService.sendTest(id)
    }

    @Patch('admin/notifications/:id/draft')
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
    getMyNotifications(@Req() req: any) {
        return this.notifService.getMyNotifications(req.user.userId)
    }

    @Get('notifications/unread-count')
    getUnreadCount(@Req() req: any) {
        return this.notifService.getUnreadCount(req.user.userId)
    }

    @Patch('notifications/:id/read')
    markAsRead(@Param('id') id: string, @Req() req: any) {
        return this.notifService.markAsRead(id, req.user.userId)
    }
}
