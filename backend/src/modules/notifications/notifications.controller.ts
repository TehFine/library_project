import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req } from '@nestjs/common'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'
import { NotificationsService } from './notifications.service'
import { Notification } from './entities/notification.entity'

@Controller('admin/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private readonly notifService: NotificationsService) {}

    @Get('target-counts')
    getTargetCounts() {
        return this.notifService.getTargetCounts()
    }

    @Get()
    list() {
        return this.notifService.list()
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.notifService.findOne(id)
    }

    @Post()
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

    @Post(':id/send-test')
    sendTest(@Param('id') id: string) {
        return this.notifService.sendTest(id)
    }

    @Patch(':id/draft')
    updateDraft(@Param('id') id: string, @Body() dto: Partial<{
        title: string
        content: string
        targetGroup: string
        customRecipients: string
        variables: string[]
    }>) {
        return this.notifService.updateDraft(id, dto)
    }
}
