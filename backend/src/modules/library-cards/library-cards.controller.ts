import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common'
import { LibraryCardsService } from './library-cards.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@Controller('library-cards')
@UseGuards(JwtAuthGuard)
export class LibraryCardsController {
    constructor(private readonly service: LibraryCardsService) { }

    @Get()
    findAll() {
        return this.service.findAll()
    }

    @Get(':cardNumber')
    findByCardNumber(@Param('cardNumber') cardNumber: string) {
        return this.service.findByCardNumber(cardNumber)
    }

    @Post()
    create(@Body() body: any, @Req() req: any) {
        return this.service.create(body, req.user.userId)
    }
}
