import { Controller, Get, Patch, Req, Body, UseGuards, NotFoundException } from '@nestjs/common'
import { db } from '../../common/database/seeds/mock-db'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    @Get('me')
    me(@Req() req: any) {
        const user = db.users.find(u => u.id === req.user.userId)
        if (!user) throw new NotFoundException()
        const { passwordHash: _, ...safe } = user
        return safe
    }

    @Patch('me')
    update(@Req() req: any, @Body() body: any) {
        const user = db.users.find(u => u.id === req.user.userId)
        if (!user) throw new NotFoundException()
        if (body.fullName !== undefined) user.fullName = body.fullName
        if (body.phone !== undefined) user.phone = body.phone
        if (body.address !== undefined) user.address = body.address
        const { passwordHash: _, ...safe } = user
        return safe
    }

    @Patch('me/password')
    changePassword(@Req() req: any, @Body() body: any) {
        const user = db.users.find(u => u.id === req.user.userId)
        if (!user) throw new NotFoundException()
        
        // Trong thực tế cần so sánh bcrypt. Với mock-db này passwordHash đang là plain text
        if (user.passwordHash !== body.currentPassword) {
            throw new Error('Mật khẩu hiện tại không đúng')
        }
        
        user.passwordHash = body.newPassword
        return { message: 'Password updated' }
    }
}
