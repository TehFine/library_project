import { Controller, Get, Req, UseGuards } from '@nestjs/common'
import { db } from '../../common/database/seeds/mock-db'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@Controller('library-cards')
@UseGuards(JwtAuthGuard)
export class LibraryCardsController {
    @Get('mine')
    mine(@Req() req: any) {
        return db.libraryCards.filter(c => c.userId === req.user.userId)
    }
}
