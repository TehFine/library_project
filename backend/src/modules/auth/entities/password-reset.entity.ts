import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm'

@Entity('password_resets')
export class PasswordReset {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    email: string

    @Column()
    token: string

    @Column({ type: 'timestamp' })
    expiresAt: Date

    @Column({ default: false })
    used: boolean

    @CreateDateColumn()
    createdAt: Date
}
