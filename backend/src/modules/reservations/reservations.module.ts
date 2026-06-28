import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ReservationsController } from './reservations.controller'
import { ReservationsService } from './reservations.service'
import { Reservation } from './entities/reservation.entity'
import { Book } from '@/modules/books/entities/book.entity'
import { BookCopy } from '@/modules/books/entities/book-copy.entity'
import { Notification } from '@/modules/notifications/entities/notification.entity'
import { LibraryCardsModule } from '@/modules/library-cards/library-cards.module'
import { BorrowRecordsModule } from '@/modules/borrow-records/borrow-records.module'

@Module({
    imports: [
        TypeOrmModule.forFeature([Reservation, Book, BookCopy, Notification]),
        LibraryCardsModule,
        BorrowRecordsModule
    ],
    controllers: [ReservationsController],
    providers: [ReservationsService],
    exports: [ReservationsService]
})
export class ReservationsModule { }

