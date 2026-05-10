import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ unique: true })
    username: string

    @Column({ unique: true })
    email: string

    @Column({ select: false })
    passwordHash: string

    @Column({
        type: 'enum',
        enum: ['library_admin', 'librarian', 'reader'],
        default: 'reader'
    })
    role: string

    @Column()
    fullName: string

    @Column({ nullable: true })
    phone: string

    @Column({ nullable: true })
    idCardNumber: string

    @Column({ type: 'date', nullable: true })
    dateOfBirth: string

    @Column({ nullable: true })
    address: string

    @Column({ default: true })
    isActive: boolean

    @Column({ type: 'timestamp', nullable: true })
    lastLogin: Date

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}
