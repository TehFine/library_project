import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, OneToOne, JoinColumn, OneToMany } from 'typeorm'
import { User } from '@/modules/users/entities/user.entity'
import { BorrowRecord } from '@/modules/borrow-records/entities/borrow-record.entity'

@Entity('library_cards')
export class LibraryCard {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @OneToOne(() => User)
    @JoinColumn()
    user: User

    @Column()
    userId: string

    @ManyToOne(() => User)
    issuedBy: User

    @OneToMany(() => BorrowRecord, (record) => record.libraryCard)
    borrowRecords: BorrowRecord[]

    @Column({ unique: true })
    cardNumber: string

    @Column({ type: 'date' })
    issuedDate: string

    @Column({ type: 'date' })
    expiryDate: string

    @Column({
        type: 'enum',
        enum: ['active', 'expired', 'locked'],
        default: 'active'
    })
    status: string

    @CreateDateColumn()
    createdAt: Date
}

