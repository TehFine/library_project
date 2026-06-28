import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { FinesController } from './fines.controller'
import { FinesService } from './fines.service'
import { VnpayService } from './vnpay.service'
import { Fine } from './entities/fine.entity'
import { BorrowRecord } from '@/modules/borrow-records/entities/borrow-record.entity'
import { SystemConfig } from '@/modules/admin/entities/system-config.entity'
import { FinesCronService } from './fines-cron.service'

import { ShiftsModule } from '../shifts/shifts.module'

@Module({
    imports: [TypeOrmModule.forFeature([Fine, BorrowRecord, SystemConfig]), ShiftsModule],
    controllers: [FinesController],
    providers: [FinesService, FinesCronService, VnpayService],
    exports: [FinesService]
})
export class FinesModule { }

