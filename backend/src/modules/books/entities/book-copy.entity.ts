import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm'
import { Book } from './book.entity'

@Entity('book_copies')
export class BookCopy {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @ManyToOne(() => Book, (book) => book.copies)
    book: Book

    @Column()
    bookId: string

    @Column({ unique: true })
    copyCode: string

    @Column({
        type: 'enum',
        enum: ['new', 'good', 'fair', 'poor', 'damaged'],
        default: 'new'
    })
    condition: string

    @Column({
        type: 'enum',
        enum: ['available', 'borrowed', 'lost', 'disposed', 'reserved'],
        default: 'available'
    })
    status: string

    @Column({ type: 'text', nullable: true })
    notes: string

    @CreateDateColumn()
    createdAt: Date
}

