import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm'
import { Category } from '@/modules/categories/entities/category.entity'
import { User } from '@/modules/users/entities/user.entity'
import { BookCopy } from './book-copy.entity'

@Entity('books')
export class Book {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ unique: true })
    isbn: string

    @Column()
    title: string

    @Column()
    author: string

    @Column({ nullable: true })
    publisher: string

    @ManyToOne(() => Category, (cat) => cat.books)
    category: Category

    @Column()
    categoryId: number

    @Column({ nullable: true })
    publishYear: number

    @Column({ type: 'text', nullable: true })
    description: string

    @Column({ nullable: true })
    coverUrl: string

    @Column({ default: 0 })
    totalCopies: number

    @Column({ default: 0 })
    availableCopies: number

    @ManyToOne(() => User)
    createdBy: User

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date

    @OneToMany(() => BookCopy, (copy) => copy.book)
    copies: BookCopy[]
}
