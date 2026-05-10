import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, OneToOne, JoinColumn } from 'typeorm'
import { User } from '../../users/entities/user.entity'

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
