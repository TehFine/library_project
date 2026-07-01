import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BorrowRequest } from './entities/borrow-request.entity'
import { BorrowRequestsService } from './borrow-requests.service'
import { BorrowRequestsController } from './borrow-requests.controller'
import { LibraryCard } from '../library-cards/entities/library-card.entity'
import { Book } from '../books/entities/book.entity'
import { BorrowRecord } from '../borrow-records/entities/borrow-record.entity'
import { Fine } from '../fines/entities/fine.entity'
import { Reservation } from '../reservations/entities/reservation.entity'
import { BorrowRecordsModule } from '../borrow-records/borrow-records.module'
import { ShiftsModule } from '../shifts/shifts.module'

@Module({
    imports: [
        TypeOrmModule.forFeature([BorrowRequest, LibraryCard, Book, BorrowRecord, Fine, Reservation]),
        BorrowRecordsModule,
        ShiftsModule,
    ],
    controllers: [BorrowRequestsController],
    providers: [BorrowRequestsService],
    exports: [BorrowRequestsService]
})
export class BorrowRequestsModule { }
