import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req, Query } from '@nestjs/common'
import { LibraryCardsService } from './library-cards.service'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'

@Controller('library-cards')
@UseGuards(JwtAuthGuard)
export class LibraryCardsController {
    constructor(private readonly service: LibraryCardsService) { }

    @Get()
    findAll() {
        return this.service.findAll()
    }

    @Get('search')
    search(@Query('q') q: string) {
        return this.service.search(q)
    }

    @Get('mine')
    findMine(@Req() req: any) {
        return this.service.findMine(req.user.userId)
    }

    // ── Specific routes MUST come before parameterized :id ──
    @Get('pending-activations')
    getPendingActivations() {
        return this.service.getPendingActivations()
    }

    @Get('by-number/:cardNumber')
    findByCardNumber(@Param('cardNumber') cardNumber: string) {
        return this.service.findByCardNumber(cardNumber)
    }

    @Get(':id')
    findById(@Param('id') id: string) {
        return this.service.findByIdWithDetails(id)
    }

    @Post()
    create(@Body() body: any, @Req() req: any) {
        return this.service.create(body, req.user.userId)
    }

    @Patch(':id/renew')
    renew(@Param('id') id: string, @Body('duration') duration: string) {
        return this.service.renew(id, duration)
    }

    // ── Reader requests card activation ──
    @Post('request-activation')
    requestActivation(@Req() req: any) {
        return this.service.requestActivation(req.user.userId)
    }

    // ── Librarian approves card activation ──
    @Patch(':id/approve-activation')
    approveActivation(@Param('id') id: string, @Req() req: any) {
        return this.service.approveActivation(id, req.user.userId)
    }

    // ── Librarian rejects card activation ──
    @Patch(':id/reject-activation')
    rejectActivation(@Param('id') id: string, @Req() req: any) {
        return this.service.rejectActivation(id, req.user.userId)
    }
}

