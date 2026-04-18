import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common'
import { db } from '../../common/database/seeds/mock-db'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { enrichBorrow } from '../borrow-records/borrow-records.controller'

function paginate<T>(items: T[], page = 1, limit = 20) {
    const p = Math.max(1, Number(page))
    const l = Math.min(50, Math.max(1, Number(limit)))
    const start = (p - 1) * l
    const data = items.slice(start, start + l)
    return { data, total: items.length, page: p, limit: l, totalPages: Math.ceil(items.length / l) }
}

function enrichFine(fine: any) {
    const record = db.borrowRecords.find(r => r.id === fine.borrowRecordId)
    return { ...fine, borrowRecord: record ? enrichBorrow(record) : null }
}

@Controller('fines')
@UseGuards(JwtAuthGuard)
export class FinesController {
    @Get('mine')
    mine(@Req() req: any, @Query() q: any) {
        const card = db.libraryCards.find(c => c.userId === req.user.userId && c.status === 'active')
        if (!card) return paginate([], q.page, q.limit)

        const cardRecordIds = db.borrowRecords
            .filter(r => r.libraryCardId === card.id)
            .map(r => r.id)

        let fines = db.fines
            .filter(f => cardRecordIds.includes(f.borrowRecordId))
            .map(enrichFine)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

        if (q.status) {
            fines = fines.filter(f => f.status === q.status)
        }
        return paginate(fines, q.page, q.limit)
    }
}
