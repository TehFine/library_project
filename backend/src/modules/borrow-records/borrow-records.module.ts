import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { BorrowRecordsController } from './borrow-records.controller'

@Module({
    imports: [PassportModule],
    controllers: [BorrowRecordsController],
})
export class BorrowRecordsModule { }
