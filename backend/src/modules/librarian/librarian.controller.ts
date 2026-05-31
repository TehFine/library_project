import { Controller, Get, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'
import { LibrarianService } from './librarian.service'

@Controller('librarian')
@UseGuards(JwtAuthGuard)
export class LibrarianController {
    constructor(private readonly librarianService: LibrarianService) { }

    @Get('dashboard/stats')
    getStats() {
        return this.librarianService.getStats()
    }

    @Get('borrow-requests/pending-count')
    getPendingRequestsCount() {
        return this.librarianService.getPendingRequestsCount()
    }
}
