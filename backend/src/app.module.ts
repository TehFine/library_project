import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthModule } from './modules/auth/auth.module'
import { CategoriesModule } from './modules/categories/categories.module'
import { BooksModule } from './modules/books/books.module'
import { LibraryCardsModule } from './modules/library-cards/library-cards.module'
import { BorrowRecordsModule } from './modules/borrow-records/borrow-records.module'
import { ReservationsModule } from './modules/reservations/reservations.module'
import { FinesModule } from './modules/fines/fines.module'
import { UsersModule } from './modules/users/users.module'
import { LibrarianModule } from './modules/librarian/librarian.module'
import { BorrowRequestsModule } from './modules/borrow-requests/borrow-requests.module'
import { DatabaseModule } from './common/database/database.module'
import { RealtimeModule } from './common/websocket/realtime.module'
import { AdminModule } from './modules/admin/admin.module'
import { NotificationsModule } from './modules/notifications/notifications.module'
import { MailModule } from './common/mail/mail.module'
import { SystemTasksModule } from './modules/system-tasks/system-tasks.module'
import { ShiftsModule } from './modules/shifts/shifts.module'

@Module({
    imports: [
        ScheduleModule.forRoot(),
        MailModule,
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                type: 'postgres',
                host: configService.get<string>('DB_HOST'),
                port: configService.get<number>('DB_PORT'),
                username: configService.get<string>('DB_USERNAME'),
                password: configService.get<string>('DB_PASSWORD'),
                database: configService.get<string>('DB_DATABASE'),
                autoLoadEntities: true,
                synchronize: true,
                ...(configService.get<string>('DB_SSL') === 'true' && { ssl: { rejectUnauthorized: false } }),
            }),
            inject: [ConfigService],
        }),
        DatabaseModule,
        RealtimeModule,
        AuthModule,
        CategoriesModule,
        BooksModule,
        LibraryCardsModule,
        BorrowRecordsModule,
        ReservationsModule,
        FinesModule,
        UsersModule,
        LibrarianModule,
        BorrowRequestsModule,
        AdminModule,
        NotificationsModule,
        SystemTasksModule,
        ShiftsModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }

