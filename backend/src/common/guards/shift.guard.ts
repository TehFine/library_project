import { Injectable, CanActivate, ExecutionContext, ForbiddenException, SetMetadata } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ShiftsService } from '@/modules/shifts/shifts.service'

export const ON_SHIFT_KEY = 'onShift'

/** Decorator đánh dấu endpoint yêu cầu thủ thư đang trong ca trực */
export const OnShift = () => SetMetadata(ON_SHIFT_KEY, true)

@Injectable()
export class ShiftGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private shiftsService: ShiftsService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiresShift = this.reflector.getAllAndOverride<boolean>(ON_SHIFT_KEY, [
            context.getHandler(),
            context.getClass(),
        ])
        if (!requiresShift) return true

        const { user } = context.switchToHttp().getRequest()
        if (!user) throw new ForbiddenException('Bạn cần đăng nhập')

        // Admin luôn bypass
        if (user.role === 'library_admin') return true

        const onShift = await this.shiftsService.isOnShift(user.userId)
        if (!onShift) {
            throw new ForbiddenException('Bạn hiện không trong ca trực, không thể thực hiện thao tác này')
        }
        return true
    }
}
