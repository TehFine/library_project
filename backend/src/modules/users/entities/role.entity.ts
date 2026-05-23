import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm'

export enum RoleName {
    LIBRARY_ADMIN = 'library_admin',
    LIBRARIAN = 'librarian',
    READER = 'reader',
}

@Entity('roles')
export class Role {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'enum', enum: RoleName, unique: true })
    name: RoleName

    @Column({ nullable: true })
    description: string

    @CreateDateColumn()
    createdAt: Date
}
