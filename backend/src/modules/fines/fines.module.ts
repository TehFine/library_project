import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { FinesController } from './fines.controller'

@Module({
    imports: [PassportModule],
    controllers: [FinesController],
})
export class FinesModule { }
