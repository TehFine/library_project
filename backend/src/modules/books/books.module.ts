import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BooksController } from './books.controller'
import { BooksService } from './books.service'
import { Book } from './entities/book.entity'
import { BookCopy } from './entities/book-copy.entity'
import { BookCopySubscriber } from './subscribers/book-copy.subscriber'

@Module({
    imports: [TypeOrmModule.forFeature([Book, BookCopy])],
    controllers: [BooksController],
    providers: [BooksService, BookCopySubscriber],
    exports: [BooksService],
})
export class BooksModule { }
