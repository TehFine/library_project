import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BorrowRecordsController } from './borrow-records.controller'
import { BorrowRecordsService } from './borrow-records.service'
import { BorrowRecord } from './entities/borrow-record.entity'
import { BookCopy } from '@/modules/books/entities/book-copy.entity'
import { LibraryCard } from '@/modules/library-cards/entities/library-card.entity'

@Module({
    imports: [
        TypeOrmModule.forFeature([BorrowRecord, BookCopy, LibraryCard])
    ],
    controllers: [BorrowRecordsController],
    providers: [BorrowRecordsService],
    exports: [BorrowRecordsService]
})
export class BorrowRecordsModule { }


