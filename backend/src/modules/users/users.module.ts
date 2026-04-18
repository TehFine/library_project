import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { UsersController } from './users.controller'

@Module({
    imports: [PassportModule],
    controllers: [UsersController],
})
export class UsersModule { }
