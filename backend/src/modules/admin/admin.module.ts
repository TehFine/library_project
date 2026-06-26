import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UsersModule } from '../users/users.module';
import { BorrowRecord } from '../borrow-records/entities/borrow-record.entity';
import { Fine } from '../fines/entities/fine.entity';
import { Book } from '../books/entities/book.entity';
import { BookCopy } from '../books/entities/book-copy.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/entities/role.entity';
import { LibraryCard } from '../library-cards/entities/library-card.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { SystemConfig } from './entities/system-config.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([BorrowRecord, Fine, Book, BookCopy, Reservation, User, Role, LibraryCard, Notification, SystemConfig]),
        UsersModule,
    ],
    controllers: [AdminController],
    providers: [AdminService],
})
export class AdminModule {}
