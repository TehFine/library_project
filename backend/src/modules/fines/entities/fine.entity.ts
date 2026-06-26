import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm'
import { BorrowRecord } from '@/modules/borrow-records/entities/borrow-record.entity'
import { User } from '@/modules/users/entities/user.entity'
import { ColumnNumericTransformer } from '@/common/utils/column-numeric-transformer'

@Entity('fines')
export class Fine {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @ManyToOne(() => BorrowRecord)
    borrowRecord: BorrowRecord

    @Column()
    borrowRecordId: string

    @Column({
        type: 'enum',
        enum: ['overdue', 'damaged', 'lost'],
        default: 'overdue'
    })
    fineType: string

    @Column({ default: 0 })
    overdueDays: number

    @Column({ type: 'decimal', precision: 10, scale: 2, transformer: ColumnNumericTransformer })
    amount: number

    @Column({
        type: 'enum',
        enum: ['pending', 'paid', 'waived'],
        default: 'pending'
    })
    status: string

    @ManyToOne(() => User, { nullable: true })
    collectedBy: User

    @Column({ nullable: true })
    paymentMethod: string

    @Column({ nullable: true })
    receiptNumber: string

    @Column({ type: 'timestamp', nullable: true })
    paidAt: Date

    @CreateDateColumn()
    createdAt: Date
}

