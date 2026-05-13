import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LibrarianController } from './librarian.controller'
import { LibrarianService } from './librarian.service'
import { BorrowRecord } from '../borrow-records/entities/borrow-record.entity'
import { Fine } from '../fines/entities/fine.entity'
import { Reservation } from '../reservations/entities/reservation.entity'
import { BorrowRequest } from '../borrow-requests/entities/borrow-request.entity'

@Module({
    imports: [TypeOrmModule.forFeature([BorrowRecord, Fine, Reservation, BorrowRequest])],
    controllers: [LibrarianController],
    providers: [LibrarianService]
})
export class LibrarianModule { }
