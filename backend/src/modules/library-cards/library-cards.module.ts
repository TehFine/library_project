import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LibraryCardsController } from './library-cards.controller'
import { LibraryCardsService } from './library-cards.service'
import { LibraryCard } from './entities/library-card.entity'

@Module({
    imports: [TypeOrmModule.forFeature([LibraryCard])],
    controllers: [LibraryCardsController],
    providers: [LibraryCardsService],
    exports: [LibraryCardsService]
})
export class LibraryCardsModule { }

