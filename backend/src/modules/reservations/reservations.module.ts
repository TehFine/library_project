import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ReservationsController } from './reservations.controller'
import { ReservationsService } from './reservations.service'
import { Reservation } from './entities/reservation.entity'
import { Book } from '@/modules/books/entities/book.entity'

@Module({
    imports: [TypeOrmModule.forFeature([Reservation, Book])],
    controllers: [ReservationsController],
    providers: [ReservationsService],
    exports: [ReservationsService]
})
export class ReservationsModule { }
