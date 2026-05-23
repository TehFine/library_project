import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToOne, AfterLoad } from 'typeorm'
import { Role } from './role.entity'
import { UserProfile } from './user-profile.entity'

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

    @Column({ default: true })
    isActive: boolean

    @Column({ type: 'timestamp', nullable: true })
    lastLogin: Date

    @ManyToOne(() => Role)
    @JoinColumn({ name: 'roleId' })
    roleRelation: Role

    @Column({ nullable: true })
    roleId: number

    @OneToOne(() => UserProfile, (profile) => profile.user, { cascade: true })
    profile: UserProfile

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date

    // Virtual fields for backward compatibility with frontend
    role?: string
    fullName?: string
    phone?: string
    idCardNumber?: string
    dateOfBirth?: string
    address?: string

    @AfterLoad()
    populateVirtualFields() {
        if (this.roleRelation) {
            this.role = this.roleRelation.name
        } else {
            this.role = 'reader'
        }
        if (this.profile) {
            this.fullName = this.profile.fullName
            this.phone = this.profile.phone
            this.idCardNumber = this.profile.idCardNumber
            this.dateOfBirth = this.profile.dateOfBirth
            this.address = this.profile.address
        }
    }
}
