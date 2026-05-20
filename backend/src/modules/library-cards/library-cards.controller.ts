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

    @Get(':id')
    findById(@Param('id') id: string) {
        return this.service.findByIdWithDetails(id)
    }

    @Get(':cardNumber')
    findByCardNumber(@Param('cardNumber') cardNumber: string) {
        return this.service.findByCardNumber(cardNumber)
    }

    @Post()
    create(@Body() body: any, @Req() req: any) {
        return this.service.create(body, req.user.userId)
    }

    @Patch(':id/renew')
    renew(@Param('id') id: string, @Body('duration') duration: string) {
        return this.service.renew(id, duration)
    }
}

