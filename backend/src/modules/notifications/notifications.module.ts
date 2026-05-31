import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { NotificationsController } from './notifications.controller'
import { NotificationsService } from './notifications.service'
import { Notification } from './entities/notification.entity'
import { User } from '../users/entities/user.entity'
import { Role } from '../users/entities/role.entity'
import { BorrowRecord } from '../borrow-records/entities/borrow-record.entity'
import { LibraryCard } from '../library-cards/entities/library-card.entity'
import { Fine } from '../fines/entities/fine.entity'

@Module({
    imports: [
        TypeOrmModule.forFeature([Notification, User, Role, BorrowRecord, LibraryCard, Fine]),
    ],
    controllers: [NotificationsController],
    providers: [NotificationsService],
    exports: [NotificationsService],
})
export class NotificationsModule {}
