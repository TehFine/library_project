import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ROLES_KEY } from '../decorators/roles.decorator'
import { RoleName } from '@/modules/users/entities/role.entity'

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<RoleName[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ])

        // Nếu endpoint không yêu cầu role cụ thể, cho phép truy cập
        if (!requiredRoles || requiredRoles.length === 0) {
            return true
        }

        const { user } = context.switchToHttp().getRequest()
        if (!user) {
            throw new ForbiddenException('Bạn cần đăng nhập để truy cập tài nguyên này')
        }

        const hasRole = requiredRoles.some((role) => user.role === role)
        if (!hasRole) {
            throw new ForbiddenException('Bạn không có quyền truy cập tài nguyên này')
        }

        return true
    }
}
