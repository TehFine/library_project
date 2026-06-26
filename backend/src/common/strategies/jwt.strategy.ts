import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { UsersService } from '@/modules/users/users.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        config: ConfigService,
        private usersService: UsersService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: config.get<string>('JWT_SECRET') ?? 'fallback-secret',
        })
    }

    async validate(payload: any) {
        // Kiểm tra tài khoản còn hoạt động không (isActive)
        const user = await this.usersService.findByIdWithPassword(payload.sub).catch(() => null)
        if (!user) {
            throw new UnauthorizedException('Tài khoản không tồn tại')
        }
        if (!user.isActive) {
            const reason = user.lockedReason
                ? `Tài khoản đã bị khóa. Lý do: ${user.lockedReason}`
                : 'Tài khoản đã bị khóa. Vui lòng liên hệ thủ thư hoặc quản trị viên để biết thêm chi tiết.'
            throw new UnauthorizedException(reason)
        }
        return { userId: payload.sub, role: payload.role, roles: payload.roles ?? [] }
    }
}
