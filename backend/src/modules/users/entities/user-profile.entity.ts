import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { User } from './user.entity'

@Entity('user_profiles')
export class UserProfile {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @OneToOne(() => User, (user) => user.profile, { onDelete: 'CASCADE' })
    @JoinColumn()
    user: User

    @Column()
    userId: string

    @Column({ nullable: true })
    fullName: string

    @Column({ nullable: true })
    phone: string

    @Column({ nullable: true })
    idCardNumber: string

    @Column({ type: 'date', nullable: true })
    dateOfBirth: string

    @Column({ nullable: true })
    address: string

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}
