import { Injectable, OnApplicationBootstrap } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '@/modules/users/entities/user.entity'
import { Category } from '@/modules/categories/entities/category.entity'
import { Book } from '@/modules/books/entities/book.entity'
import { BookCopy } from '@/modules/books/entities/book-copy.entity'
import { LibraryCard } from '@/modules/library-cards/entities/library-card.entity'
import { BorrowRecord } from '@/modules/borrow-records/entities/borrow-record.entity'
import { Reservation } from '@/modules/reservations/entities/reservation.entity'
import { Fine } from '@/modules/fines/entities/fine.entity'
import { db } from './mock-db'

@Injectable()
export class SeedService implements OnApplicationBootstrap {
    constructor(
        @InjectRepository(User) private userRepo: Repository<User>,
        @InjectRepository(Category) private catRepo: Repository<Category>,
        @InjectRepository(Book) private bookRepo: Repository<Book>,
        @InjectRepository(BookCopy) private copyRepo: Repository<BookCopy>,
        @InjectRepository(LibraryCard) private cardRepo: Repository<LibraryCard>,
        @InjectRepository(BorrowRecord) private borrowRepo: Repository<BorrowRecord>,
        @InjectRepository(Reservation) private resRepo: Repository<Reservation>,
        @InjectRepository(Fine) private fineRepo: Repository<Fine>,
    ) { }

    async onApplicationBootstrap() {
        const userCount = await this.userRepo.count()
        if (userCount > 0) {
            console.log('Database already seeded. Skipping...')
            return
        }

        console.log('Seeding database...')

        // 1. Users
        for (const u of db.users) {
            await this.userRepo.save(this.userRepo.create(u))
        }

        // 2. Categories
        for (const c of db.categories) {
            await this.catRepo.save(this.catRepo.create(c))
        }

        // 3. Books
        for (const b of db.books) {
            const { totalCopies: _, availableCopies: __, ...rest } = b
            await this.bookRepo.save(this.bookRepo.create(rest))
        }

        // 4. Book Copies
        for (const c of db.bookCopies) {
            await this.copyRepo.save(this.copyRepo.create(c))
        }

        // 5. Library Cards
        for (const lc of db.libraryCards) {
            await this.cardRepo.save(this.cardRepo.create(lc))
        }

        // 6. Borrow Records
        for (const br of db.borrowRecords) {
            await this.borrowRepo.save(this.borrowRepo.create(br))
        }

        // 7. Reservations
        for (const r of db.reservations) {
            await this.resRepo.save(this.resRepo.create(r))
        }

        // 8. Fines
        for (const f of db.fines) {
            await this.fineRepo.save(this.fineRepo.create(f))
        }

        console.log('Seeding completed!')
    }
}
