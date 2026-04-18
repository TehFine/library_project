import { Module } from '@nestjs/common'
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

@Module({
    imports: [
        AuthModule,
        CategoriesModule,
        BooksModule,
        LibraryCardsModule,
        BorrowRecordsModule,
        ReservationsModule,
        FinesModule,
        UsersModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }
