import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { LibraryCardsController } from './library-cards.controller'

@Module({
    imports: [PassportModule],
    controllers: [LibraryCardsController],
})
export class LibraryCardsModule { }
