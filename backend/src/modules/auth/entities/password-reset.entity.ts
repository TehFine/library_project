import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { User } from '../../users/entities/user.entity'

@Entity('password_resets')
export class PasswordReset {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User

    @Column()
    userId: string

    @Column()
    token: string

    @Column({ type: 'timestamp' })
    expiresAt: Date

    @Column({ default: false })
    used: boolean

    @CreateDateColumn()
    createdAt: Date
}
