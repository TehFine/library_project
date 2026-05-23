import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { UsersService } from '../users/users.service'
import { RoleName } from '../users/entities/role.entity'

@Injectable()
export class AuthService {
  constructor(
    private jwt: JwtService,
    private usersService: UsersService
  ) { }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmailOrUsername(email)

    if (!user) throw new UnauthorizedException('Email hoặc mật khẩu không đúng')
    if (!user.isActive) throw new UnauthorizedException('Tài khoản đã bị khóa')

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) throw new UnauthorizedException('Email hoặc mật khẩu không đúng')

    // Cập nhật lastLogin
    await this.usersService.update(user.id, { lastLogin: new Date() })

    const primaryRole = user.role || 'reader'
    const payload = { sub: user.id, role: primaryRole, roles: [primaryRole] }
    const accessToken = this.jwt.sign(payload)

    const { passwordHash: _, ...safeUser } = user
    return { accessToken, user: safeUser }
  }

  async register(dto: any) {
    const exists = await this.usersService.findByEmailOrUsername(dto.email) ||
                   await this.usersService.findByEmailOrUsername(dto.username)

    if (exists) throw new ConflictException('Email hoặc tên đăng nhập đã tồn tại')

    const passwordHash = await bcrypt.hash(dto.password, 10)
    await this.usersService.create({
      username: dto.username,
      email: dto.email,
      passwordHash,
      isActive: true,
      roleName: RoleName.READER,
      profile: {
        fullName: dto.fullName ?? null,
        phone: dto.phone ?? null,
        dateOfBirth: dto.dateOfBirth ?? null,
        address: dto.address ?? null,
      },
    })

    return { message: 'Đăng ký thành công' }
  }

  async getMe(userId: string) {
    const user = await this.usersService.findOne(userId)
    const { passwordHash: _, ...safeUser } = user
    return safeUser
  }
}
