import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { User } from '@/modules/users/entities/user.entity'

@Entity('shifts')
export class Shift {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    librarianId: string

    @ManyToOne(() => User)
    @JoinColumn({ name: 'librarianId' })
    librarian: User

    @Column({ type: 'timestamp' })
    startTime: Date

    @Column({ type: 'timestamp' })
    endTime: Date

    @Column({ nullable: true })
    note: string

    @CreateDateColumn()
    createdAt: Date
}
