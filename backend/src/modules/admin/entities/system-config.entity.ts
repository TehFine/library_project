import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('system_config')
export class SystemConfig {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ unique: true })
    key: string

    @Column({ type: 'text' })
    value: string

    @Column({ nullable: true })
    description: string

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}
