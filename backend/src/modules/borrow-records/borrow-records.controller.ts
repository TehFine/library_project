import { Controller, Get, Post, Param, Query, Req, UseGuards, NotFoundException, BadRequestException } from '@nestjs/common'
import { db } from '../../common/database/seeds/mock-db'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

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

export function enrichBorrow(record: any) {
    const copy = db.bookCopies.find(c => c.id === record.bookCopyId)
    const book = copy ? db.books.find(b => b.id === copy.bookId) : null
    return {
        ...record,
        bookCopy: copy ?? null,
        book: book ? attachCategory(book) : null,
    }
}

@Controller('borrow-records')
@UseGuards(JwtAuthGuard)
export class BorrowRecordsController {
    @Get('mine')
    mine(@Req() req: any, @Query() q: any) {
        const card = db.libraryCards.find(c => c.userId === req.user.userId && c.status === 'active')
        if (!card) return paginate([], q.page, q.limit)

        let records = db.borrowRecords
            .filter(r => r.libraryCardId === card.id)
            .map(enrichBorrow)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

        if (q.status) {
            const statuses = q.status.split(',')
            records = records.filter(r => statuses.includes(r.status))
        }
        return paginate(records, q.page, q.limit)
    }

    @Post(':id/renew')
    renew(@Param('id') id: string, @Req() req: any) {
        const record = db.borrowRecords.find(r => r.id === id)
        if (!record) throw new NotFoundException()
        if (record.renewalCount >= 1) throw new BadRequestException('Đã gia hạn tối đa 1 lần')
        if (record.status !== 'borrowing') throw new BadRequestException('Chỉ gia hạn được sách đang mượn')

        const newDue = new Date(record.dueDate)
        newDue.setDate(newDue.getDate() + 14)

        record.originalDueDate = record.dueDate
        record.dueDate = newDue.toISOString().split('T')[0]
        record.renewalCount = 1
        record.renewedAt = new Date().toISOString()
        record.renewedBy = req.user.userId

        return enrichBorrow(record)
    }
}
