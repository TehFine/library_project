import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { db } from '../../common/database/seeds/mock-db'

@Injectable()
export class AuthService {
  constructor(private jwt: JwtService) { }

  async login(email: string, password: string) {
    const user = db.users.find(u => u.email === email || u.username === email)
    if (!user) throw new UnauthorizedException('Email hoặc mật khẩu không đúng')
    if (!user.isActive) throw new UnauthorizedException('Tài khoản đã bị khóa')

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) throw new UnauthorizedException('Email hoặc mật khẩu không đúng')

    user.lastLogin = new Date().toISOString()

    const payload = { sub: user.id, role: user.role }
    const accessToken = this.jwt.sign(payload)

    const { passwordHash: _, ...safeUser } = user
    return { accessToken, user: safeUser }
  }

  async register(dto: any) {
    const exists = db.users.find(u => u.email === dto.email || u.username === dto.username)
    if (exists) throw new UnauthorizedException('Email hoặc tên đăng nhập đã tồn tại')

    const passwordHash = await bcrypt.hash(dto.password, 10)
    const newUser = {
      id: `user-${Date.now()}`,
      username: dto.username,
      email: dto.email,
      passwordHash,
      role: 'reader',
      fullName: dto.fullName,
      phone: dto.phone ?? null,
      idCardNumber: null,
      dateOfBirth: dto.dateOfBirth ?? null,
      address: dto.address ?? null,
      isActive: true,
      lastLogin: null,
      createdAt: new Date().toISOString(),
    }
    db.users.push(newUser)
    return { message: 'Đăng ký thành công' }
  }

  async getMe(userId: string) {
    const user = db.users.find(u => u.id === userId)
    if (!user) throw new UnauthorizedException()
    const { passwordHash: _, ...safeUser } = user
    return safeUser
  }
}