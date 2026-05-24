import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm'
import { LibraryCard } from '@/modules/library-cards/entities/library-card.entity'
import { Book } from '@/modules/books/entities/book.entity'
import { BookCopy } from '@/modules/books/entities/book-copy.entity'

@Entity('reservations')
export class Reservation {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @ManyToOne(() => LibraryCard)
    libraryCard: LibraryCard

    @Column()
    libraryCardId: string

    @ManyToOne(() => Book)
    book: Book

    @Column()
    bookId: string

    @ManyToOne(() => BookCopy, { nullable: true })
    reservedCopy: BookCopy

    @Column({ nullable: true })
    reservedCopyId: string

    @Column({ default: 1 })
    queuePosition: number

    @Column({
        type: 'enum',
        enum: ['waiting', 'notified', 'completed', 'cancelled', 'expired'],
        default: 'waiting'
    })
    status: string

    @CreateDateColumn()
    reservedAt: Date

    @Column({ type: 'timestamp', nullable: true })
    notifiedAt: Date

    @Column({ type: 'timestamp', nullable: true })
    expiresAt: Date
}

