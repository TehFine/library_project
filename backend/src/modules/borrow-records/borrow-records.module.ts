import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BorrowRecordsController } from './borrow-records.controller'
import { BorrowRecordsService } from './borrow-records.service'
import { BorrowRecord } from './entities/borrow-record.entity'
import { BookCopy } from '@/modules/books/entities/book-copy.entity'
import { LibraryCard } from '@/modules/library-cards/entities/library-card.entity'
import { Book } from '@/modules/books/entities/book.entity'
import { Reservation } from '@/modules/reservations/entities/reservation.entity'
import { Fine } from '@/modules/fines/entities/fine.entity'
import { SystemConfig } from '@/modules/admin/entities/system-config.entity'
import { Notification } from '@/modules/notifications/entities/notification.entity'
import { ShiftsModule } from '@/modules/shifts/shifts.module'

@Module({
    imports: [
        TypeOrmModule.forFeature([BorrowRecord, BookCopy, LibraryCard, Book, Reservation, Fine, SystemConfig, Notification]),
        ShiftsModule,
    ],
    controllers: [BorrowRecordsController],
    providers: [BorrowRecordsService],
    exports: [BorrowRecordsService]
})
export class BorrowRecordsModule { }


