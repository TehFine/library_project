import { Controller, Get, Patch, Req, Body, UseGuards, BadRequestException, Query } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiBody } from '@nestjs/swagger'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'
import { RolesGuard } from '@/common/guards/roles.guard'
import { Roles } from '@/common/decorators/roles.decorator'
import { RoleName } from '../users/entities/role.entity'
import { UsersService } from './users.service'
import * as bcrypt from 'bcryptjs'

@ApiTags('Users - Người dùng')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('search')
    @UseGuards(RolesGuard)
    @Roles(RoleName.LIBRARIAN, RoleName.LIBRARY_ADMIN)
    @ApiOperation({ summary: 'Tìm kiếm người dùng theo tên, email, hoặc số thẻ' })
    @ApiQuery({ name: 'q', description: 'Từ khoá tìm kiếm', example: 'Nguyen Van A' })
    async search(@Query('q') q: string) {
        if (!q) return [];
        return this.usersService.searchUsers(q);
    }

    @Get('me')
    @ApiOperation({ summary: 'Lấy thông tin cá nhân' })
    async me(@Req() req: any) {
        const user = await this.usersService.findOne(req.user.userId)
        const { passwordHash: _, ...safe } = user
        return safe
    }

    @Patch('me')
    @ApiOperation({ summary: 'Cập nhật thông tin cá nhân' })
    @ApiBody({ schema: { example: { fullName: 'Nguyen Van A', phone: '0123456789' } } })
    async update(@Req() req: any, @Body() body: any) {
        const user = await this.usersService.updateProfile(req.user.userId, body)
        const { passwordHash: _, ...safe } = user
        return safe
    }

    @Patch('me/password')
    @ApiOperation({ summary: 'Đổi mật khẩu' })
    @ApiBody({ schema: { example: { currentPassword: 'oldpass', newPassword: 'newpass' } } })
    async changePassword(@Req() req: any, @Body() body: any) {
        const user = await this.usersService.findByIdWithPassword(req.user.userId)
        
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
