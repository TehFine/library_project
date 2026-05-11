import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { FinesController } from './fines.controller'
import { FinesService } from './fines.service'
import { Fine } from './entities/fine.entity'

@Module({
    imports: [TypeOrmModule.forFeature([Fine])],
    controllers: [FinesController],
    providers: [FinesService],
    exports: [FinesService]
})
export class FinesModule { }

