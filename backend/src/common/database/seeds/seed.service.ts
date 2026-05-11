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
        console.log('Seeding users...')
        for (const u of db.users) {
            await this.userRepo.save(this.userRepo.create(u))
        }

        // 2. Categories
        console.log('Seeding categories...')
        for (const c of db.categories) {
            await this.catRepo.save(this.catRepo.create(c))
        }

        // 3. Books
        console.log('Seeding books...')
        for (const b of db.books) {
            const { totalCopies: _, availableCopies: __, ...rest } = b
            // Map createdBy string ID to user object for TypeORM
            const bookData = {
                ...rest,
                createdBy: { id: b.createdBy }
            }
            await this.bookRepo.save(this.bookRepo.create(bookData))
        }

        // 4. Book Copies
        console.log('Seeding book copies...')
        for (const c of db.bookCopies) {
            const copyData = {
                ...c,
                book: { id: c.bookId }
            }
            await this.copyRepo.save(this.copyRepo.create(copyData))
        }

        // 5. Library Cards
        console.log('Seeding library cards...')
        for (const lc of db.libraryCards) {
            const cardData = {
                ...lc,
                user: { id: lc.userId },
                issuedBy: { id: lc.issuedBy }
            }
            await this.cardRepo.save(this.cardRepo.create(cardData))
        }

        // 6. Borrow Records
        console.log('Seeding borrow records...')
        for (const br of db.borrowRecords) {
            const borrowData = {
                ...br,
                libraryCard: { id: br.libraryCardId },
                bookCopy: { id: br.bookCopyId },
                librarian: { id: br.librarianId }
            }
            await this.borrowRepo.save(this.borrowRepo.create(borrowData))
        }

        // 7. Reservations
        console.log('Seeding reservations...')
        for (const r of db.reservations) {
            const resData = {
                ...r,
                libraryCard: { id: r.libraryCardId },
                book: { id: r.bookId }
            }
            await this.resRepo.save(this.resRepo.create(resData))
        }

        // 8. Fines
        console.log('Seeding fines...')
        for (const f of db.fines) {
            const fineData = {
                ...f,
                borrowRecord: { id: f.borrowRecordId }
            }
            await this.fineRepo.save(this.fineRepo.create(fineData))
        }

        // 9. Update Book Counts (to fix the 0 copies bug)
        console.log('Updating book copy counts...')
        const books = await this.bookRepo.find()
        for (const book of books) {
            const copies = await this.copyRepo.find({ where: { book: { id: book.id } } })
            const total = copies.length
            const available = copies.filter(c => c.status === 'available').length
            await this.bookRepo.update(book.id, {
                totalCopies: total,
                availableCopies: available
            })
        }

        console.log('Seeding completed!')
    }
}

