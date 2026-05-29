import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm'
import { User } from '@/modules/users/entities/user.entity'

@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    notificationType: string  // 'bulk' | 'test'

    @Column()
    title: string

    @Column('text')
    content: string

    @Column({ nullable: true })
    targetGroup: string  // 'all' | 'overdue' | 'expiring' | 'debt'

    @Column({ nullable: true })
    customRecipients: string  // comma-separated emails/card numbers

    @Column({ default: 0 })
    recipientCount: number

    @Column({ default: 0 })
    sentCount: number

    @Column({ default: 'email' })
    channel: string

    @Column({ default: 'draft' })
    status: string  // 'draft' | 'sent'

    @Column({ nullable: true })
    userId: string  // reader this notification belongs to (null = bulk record)

    @Column({ default: false })
    read: boolean

    @Column('simple-json', { nullable: true })
    variables: string[]  // e.g. ['{{tên_độc_giả}}', '{{số_ngày}}']

    @Column({ type: 'timestamp', nullable: true })
    sentAt: Date

    @ManyToOne(() => User)
    createdBy: User

    @Column()
    createdById: string

    @CreateDateColumn()
    createdAt: Date
}
