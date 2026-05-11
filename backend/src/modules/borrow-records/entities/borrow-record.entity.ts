import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm'
import { LibraryCard } from '@/modules/library-cards/entities/library-card.entity'
import { BookCopy } from '@/modules/books/entities/book-copy.entity'
import { User } from '@/modules/users/entities/user.entity'

@Entity('borrow_records')
export class BorrowRecord {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @ManyToOne(() => LibraryCard)
    libraryCard: LibraryCard

    @Column()
    libraryCardId: string

    @ManyToOne(() => BookCopy)
    bookCopy: BookCopy

    @Column()
    bookCopyId: string

    @ManyToOne(() => User)
    librarian: User

    @Column({ type: 'date' })
    borrowDate: string

    @Column({ type: 'date' })
    dueDate: string

    @Column({ type: 'date', nullable: true })
    returnDate: string

    @Column({
        type: 'enum',
        enum: ['borrowing', 'returned', 'overdue', 'lost'],
        default: 'borrowing'
    })
    status: string

    @Column({ default: 0 })
    renewalCount: number

    @Column({ type: 'date', nullable: true })
    originalDueDate: string

    @Column({ type: 'timestamp', nullable: true })
    renewedAt: Date

    @ManyToOne(() => User, { nullable: true })
    renewedBy: User

    @CreateDateColumn()
    createdAt: Date
}

