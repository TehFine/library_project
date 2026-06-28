import { SetMetadata } from '@nestjs/common'
import { RoleName } from '@/modules/users/entities/role.entity'

export const ROLES_KEY = 'roles'
export const IS_PUBLIC_KEY = 'isPublic'
export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles)
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)
