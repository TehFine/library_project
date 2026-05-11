import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BorrowRecordsController } from './borrow-records.controller'
import { BorrowRecordsService } from './borrow-records.service'
import { BorrowRecord } from './entities/borrow-record.entity'
import { BookCopy } from '@/modules/books/entities/book-copy.entity'
import { LibraryCard } from '@/modules/library-cards/entities/library-card.entity'
import { Book } from '@/modules/books/entities/book.entity'

@Module({
    imports: [
        TypeOrmModule.forFeature([BorrowRecord, BookCopy, LibraryCard, Book])
    ],
    controllers: [BorrowRecordsController],
    providers: [BorrowRecordsService],
    exports: [BorrowRecordsService]
})
export class BorrowRecordsModule { }

