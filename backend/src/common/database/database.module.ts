import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SeedService } from './seeds/seed.service'
import { User } from '@/modules/users/entities/user.entity'
import { Category } from '@/modules/categories/entities/category.entity'
import { Book } from '@/modules/books/entities/book.entity'
import { BookCopy } from '@/modules/books/entities/book-copy.entity'
import { LibraryCard } from '@/modules/library-cards/entities/library-card.entity'
import { BorrowRecord } from '@/modules/borrow-records/entities/borrow-record.entity'
import { Reservation } from '@/modules/reservations/entities/reservation.entity'
import { Fine } from '@/modules/fines/entities/fine.entity'

@Module({
    imports: [
        TypeOrmModule.forFeature([
            User, Category, Book, BookCopy, 
            LibraryCard, BorrowRecord, Reservation, Fine
        ])
    ],
    providers: [SeedService],
    exports: [SeedService]
})
export class DatabaseModule { }
