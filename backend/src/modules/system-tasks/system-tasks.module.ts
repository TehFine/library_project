import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SystemTasksService } from './system-tasks.service'
import { BorrowRecord } from '@/modules/borrow-records/entities/borrow-record.entity'
import { Reservation } from '@/modules/reservations/entities/reservation.entity'
import { BookCopy } from '@/modules/books/entities/book-copy.entity'
import { Notification } from '@/modules/notifications/entities/notification.entity'
import { User } from '@/modules/users/entities/user.entity'
import { Role } from '@/modules/users/entities/role.entity'
import { Fine } from '@/modules/fines/entities/fine.entity'
import { SystemConfig } from '@/modules/admin/entities/system-config.entity'
import { RealtimeModule } from '@/common/websocket/realtime.module'

@Module({
    imports: [
        TypeOrmModule.forFeature([BorrowRecord, Reservation, BookCopy, Notification, User, Role, Fine, SystemConfig]),
        RealtimeModule,
    ],
    providers: [SystemTasksService],
})
export class SystemTasksModule {}
