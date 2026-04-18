import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { ReservationsController } from './reservations.controller'

@Module({
    imports: [PassportModule],
    controllers: [ReservationsController],
})
export class ReservationsModule { }
