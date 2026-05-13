import { Controller, Get, Patch, Req, Body, UseGuards, BadRequestException } from '@nestjs/common'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'
import { UsersService } from './users.service'
import * as bcrypt from 'bcryptjs'

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('me')
    async me(@Req() req: any) {
        const user = await this.usersService.findOne(req.user.userId)
        const { passwordHash: _, ...safe } = user
        return safe
    }

    @Patch('me')
    async update(@Req() req: any, @Body() body: any) {
        const user = await this.usersService.update(req.user.userId, body)
        const { passwordHash: _, ...safe } = user
        return safe
    }

    @Patch('me/password')
    async changePassword(@Req() req: any, @Body() body: any) {
        const user = await this.usersService.findOne(req.user.userId)
        
        const isMatch = await bcrypt.compare(body.currentPassword, user.passwordHash)
        if (!isMatch) {
            throw new BadRequestException('Mật khẩu hiện tại không đúng')
        }
        
        const salt = await bcrypt.genSalt(10)
        const newPasswordHash = await bcrypt.hash(body.newPassword, salt)
        
        await this.usersService.update(user.id, { passwordHash: newPasswordHash })
        return { message: 'Password updated successfully' }
    }
}

