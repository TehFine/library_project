import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm'
import { LibraryCard } from '@/modules/library-cards/entities/library-card.entity'
import { Book } from '@/modules/books/entities/book.entity'
import { User } from '@/modules/users/entities/user.entity'

@Entity('borrow_requests')
export class BorrowRequest {
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

    @Column({
        type: 'enum',
        enum: ['pending', 'approved', 'rejected', 'cancelled'],
        default: 'pending'
    })
    status: string

    @CreateDateColumn()
    requestedAt: Date

    @Column({ type: 'timestamp', nullable: true })
    processedAt: Date

    @ManyToOne(() => User, { nullable: true })
    processedBy: User

    @Column({ nullable: true })
    rejectionReason: string
}
