import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BorrowRequest } from './entities/borrow-request.entity'
import { BorrowRequestsService } from './borrow-requests.service'
import { BorrowRequestsController } from './borrow-requests.controller'
import { LibraryCard } from '../library-cards/entities/library-card.entity'
import { Book } from '../books/entities/book.entity'
import { BorrowRecordsModule } from '../borrow-records/borrow-records.module'

@Module({
    imports: [
        TypeOrmModule.forFeature([BorrowRequest, LibraryCard, Book]),
        BorrowRecordsModule
    ],
    controllers: [BorrowRequestsController],
    providers: [BorrowRequestsService],
    exports: [BorrowRequestsService]
})
export class BorrowRequestsModule { }
