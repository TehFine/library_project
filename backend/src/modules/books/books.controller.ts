import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common'
import { db } from '../../common/database/seeds/mock-db'

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

@Controller('books')
export class BooksController {
    @Get()
    list(@Query() q: any) {
        let books = db.books.map(attachCategory)

        if (q.search) {
            const s = q.search.toLowerCase()
            books = books.filter(b =>
                b.title.toLowerCase().includes(s) ||
                b.author.toLowerCase().includes(s) ||
                b.isbn.includes(s) ||
                (b.publisher ?? '').toLowerCase().includes(s)
            )
        }
        if (q.categoryId) {
            books = books.filter(b => b.categoryId === Number(q.categoryId))
        }
        if (q.available) {
            books = books.filter(b => b.availableCopies > 0)
        }
        return paginate(books, q.page, q.limit)
    }

    @Get(':id')
    detail(@Param('id') id: string) {
        const book = db.books.find(b => b.id === id)
        if (!book) throw new NotFoundException('Không tìm thấy sách')
        return attachCategory(book)
    }
}
