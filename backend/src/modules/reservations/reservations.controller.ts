import { Controller, Get, Post, Param, Query, Req, Body, UseGuards, NotFoundException, BadRequestException } from '@nestjs/common'
import { db } from '../../common/database/seeds/mock-db'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { v4 as uuid } from 'uuid'

function paginate<T>(items: T[], page = 1, limit = 20) {
    const p = Math.max(1, Number(page))
    const l = Math.min(50, Math.max(1, Number(limit)))
    const start = (p - 1) * l
    const data = items.slice(start, start + l)
    return { data, total: items.length, page: p, limit: l, totalPages: Math.ceil(items.length / l) }
}

function attachCategory(book: any) {
    const cat = db.categories.find(c => c.id === book.categoryId)
    return { ...book, category: cat ?? { id: 0, name: '—' } }
}

function enrichReservation(r: any) {
    const book = db.books.find(b => b.id === r.bookId)
    return { ...r, book: book ? attachCategory(book) : null }
}

@Controller('reservations')
@UseGuards(JwtAuthGuard)
export class ReservationsController {
    @Get('mine')
    mine(@Req() req: any, @Query() q: any) {
        const card = db.libraryCards.find(c => c.userId === req.user.userId && c.status === 'active')
        if (!card) return paginate([], q.page, q.limit)

        let list = db.reservations
            .filter(r => r.libraryCardId === card.id)
            .map(enrichReservation)
            .sort((a, b) => new Date(b.reservedAt).getTime() - new Date(a.reservedAt).getTime())

        if (q.status) {
            const statuses = q.status.split(',')
            list = list.filter(r => statuses.includes(r.status))
        }
        return paginate(list, q.page, q.limit)
    }

    @Post()
    create(@Body() body: { bookId: string }, @Req() req: any) {
        const card = db.libraryCards.find(c => c.userId === req.user.userId && c.status === 'active')
        if (!card) throw new BadRequestException('Bạn cần có thẻ thư viện để đặt trước')

        const book = db.books.find(b => b.id === body.bookId)
        if (!book) throw new NotFoundException('Không tìm thấy sách')
        if (book.availableCopies > 0) throw new BadRequestException('Sách đang có sẵn, hãy đến thư viện mượn trực tiếp')

        const existing = db.reservations.find(
            r => r.libraryCardId === card.id && r.bookId === body.bookId && ['waiting', 'notified'].includes(r.status)
        )
        if (existing) throw new BadRequestException('Bạn đã đặt trước sách này rồi')

        const maxPos = db.reservations
            .filter(r => r.bookId === body.bookId && r.status === 'waiting')
            .reduce((max, r) => Math.max(max, r.queuePosition), 0)

        const newRes = {
            id: uuid(),
            libraryCardId: card.id,
            bookId: body.bookId,
            queuePosition: maxPos + 1,
            status: 'waiting',
            reservedAt: new Date().toISOString(),
            notifiedAt: null,
            expiresAt: null,
        }
        db.reservations.push(newRes)
        return enrichReservation(newRes)
    }

    @Post(':id/cancel')
    cancel(@Param('id') id: string) {
        const r = db.reservations.find(x => x.id === id)
        if (!r) throw new NotFoundException()
        r.status = 'cancelled'
        return { success: true }
    }
}
