import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'
import { User } from './entities/user.entity'
import { UserProfile } from './entities/user-profile.entity'
import { Role } from './entities/role.entity'

@Module({
    imports: [TypeOrmModule.forFeature([User, UserProfile, Role])],
    controllers: [UsersController],
    providers: [UsersService],
    exports: [UsersService, TypeOrmModule],
})
export class UsersModule { }
