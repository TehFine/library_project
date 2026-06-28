import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ShiftsController } from './shifts.controller'
import { ShiftsService } from './shifts.service'
import { ShiftGuard } from '@/common/guards/shift.guard'
import { Shift } from './entities/shift.entity'
import { User } from '@/modules/users/entities/user.entity'

@Module({
    imports: [TypeOrmModule.forFeature([Shift, User])],
    controllers: [ShiftsController],
    providers: [ShiftsService, ShiftGuard],
    exports: [ShiftsService, ShiftGuard, TypeOrmModule],
})
export class ShiftsModule { }
