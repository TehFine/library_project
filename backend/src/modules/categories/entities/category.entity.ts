import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm'
import { Book } from '../../books/entities/book.entity'

@Entity('categories')
export class Category {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ unique: true })
    name: string

    @OneToMany(() => Book, (book) => book.category)
    books: Book[]
}
