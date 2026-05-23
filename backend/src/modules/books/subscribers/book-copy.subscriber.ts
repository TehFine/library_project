import {
    DataSource,
    EntitySubscriberInterface,
    EventSubscriber,
    InsertEvent,
    UpdateEvent,
    RemoveEvent,
    EntityManager,
} from 'typeorm'
import { Injectable } from '@nestjs/common'
import { BookCopy } from '../entities/book-copy.entity'
import { Book } from '../entities/book.entity'

/**
 * Subscriber tự động đồng bộ books.totalCopies và books.availableCopies
 * mỗi khi có thay đổi trên bảng book_copies.
 * Điều này đảm bảo hai cột đếm luôn chính xác, không phụ thuộc vào
 * việc các service có nhớ cập nhật thủ công hay không.
 */
@Injectable()
@EventSubscriber()
export class BookCopySubscriber implements EntitySubscriberInterface<BookCopy> {
    constructor(dataSource: DataSource) {
        dataSource.subscribers.push(this)
    }

    listenTo() {
        return BookCopy
    }

    async afterInsert(event: InsertEvent<BookCopy>): Promise<void> {
        const bookId = event.entity?.bookId
        if (bookId) {
            await this.recalculate(bookId, event.manager)
        }
    }

    async afterUpdate(event: UpdateEvent<BookCopy>): Promise<void> {
        const bookId = event.entity?.bookId ?? event.databaseEntity?.bookId
        if (bookId) {
            await this.recalculate(bookId as string, event.manager)
        }
    }

    async afterRemove(event: RemoveEvent<BookCopy>): Promise<void> {
        const bookId = event.databaseEntity?.bookId
        if (bookId) {
            await this.recalculate(bookId, event.manager)
        }
    }

    private async recalculate(bookId: string, manager: EntityManager): Promise<void> {
        const copies = await manager.find(BookCopy, { where: { bookId } })
        await manager.update(Book, bookId, {
            totalCopies: copies.length,
            availableCopies: copies.filter((c: BookCopy) => c.status === 'available').length,
        })
    }
}
