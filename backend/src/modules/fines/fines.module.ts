import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { FinesController } from './fines.controller'
import { FinesService } from './fines.service'
import { Fine } from './entities/fine.entity'
import { BorrowRecord } from '@/modules/borrow-records/entities/borrow-record.entity'
import { FinesCronService } from './fines-cron.service'

@Module({
    imports: [TypeOrmModule.forFeature([Fine, BorrowRecord])],
    controllers: [FinesController],
    providers: [FinesService, FinesCronService],
    exports: [FinesService]
})
export class FinesModule { }

