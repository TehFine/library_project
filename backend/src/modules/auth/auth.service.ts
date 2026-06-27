import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, MoreThan } from 'typeorm'
import * as bcrypt from 'bcryptjs'
import * as crypto from 'crypto'
import { RealtimeGateway } from '@/common/websocket/realtime.gateway'
import { UsersService } from '../users/users.service'
import { RoleName } from '../users/entities/role.entity'
import { PasswordReset } from './entities/password-reset.entity'
import { RegisterDto } from './dto/register.dto'

@Injectable()
export class AuthService {
  constructor(
    private jwt: JwtService,
    private usersService: UsersService,
    private realtime: RealtimeGateway,
    @InjectRepository(PasswordReset)
    private passwordResetRepo: Repository<PasswordReset>,
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

  async register(dto: RegisterDto) {
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
        fullName: dto.fullName,
        phone: dto.phone,
        dateOfBirth: dto.dateOfBirth,
        address: dto.address,
      },
    })

    this.realtime.emit('admin:dashboard-update')
    
    return { message: 'Đăng ký thành công' }
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmailOrUsername(email)
    if (!user) {
      // Don't reveal whether email exists for security
      return { message: 'Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.' }
    }

    // Invalidate any existing unused tokens for this user
    await this.passwordResetRepo.update(
      { userId: user.id, used: false, expiresAt: MoreThan(new Date()) } as any,
      { used: true },
    )

    // Generate a secure random token
    const rawToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = await bcrypt.hash(rawToken, 10)

    const reset = this.passwordResetRepo.create({
      userId: user.id,
      token: hashedToken,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    })
    await this.passwordResetRepo.save(reset)

    // For now, return the token directly since there's no email service.
    // In production you'd send this via email: `${baseUrl}/auth/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`
    console.log(`\n🔐 Password reset requested for ${user.email}`)
    console.log(`   Reset token: ${rawToken}`)
    console.log(`   Link: http://localhost:3000/auth/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}\n`)

    return {
      message: 'Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.',
      // Development only — remove in production!
      _devToken: rawToken,
      _devLink: `/auth/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`,
    }
  }

  async resetPassword(token: string, email: string, newPassword: string) {
    // Find the user
    const user = await this.usersService.findByEmailOrUsername(email)
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản')

    // Find all unused, non-expired tokens for this user
    const resets = await this.passwordResetRepo.find({
      where: {
        userId: user.id,
        used: false,
        expiresAt: MoreThan(new Date()),
      } as any,
      order: { createdAt: 'DESC' as any },
    })

    if (resets.length === 0) {
      throw new BadRequestException('Token không hợp lệ hoặc đã hết hạn')
    }

    // Try to match the token against any stored hash
    let matchedReset: PasswordReset | null = null
    for (const reset of resets) {
      const isValid = await bcrypt.compare(token, reset.token)
      if (isValid) {
        matchedReset = reset
        break
      }
    }

    if (!matchedReset) {
      throw new BadRequestException('Token không hợp lệ hoặc đã hết hạn')
    }

    // Update password
    const passwordHash = await bcrypt.hash(newPassword, 10)
    await this.usersService.update(user.id, { passwordHash } as any)

    // Mark token as used
    await this.passwordResetRepo.update(matchedReset.id, { used: true })

    // Invalidate all other tokens for this user
    await this.passwordResetRepo.update(
      { userId: user.id, used: false } as any,
      { used: true },
    )

    return { message: 'Mật khẩu đã được đặt lại thành công' }
  }

  async getMe(userId: string) {
    const user = await this.usersService.findOne(userId)
    const { passwordHash: _, ...safeUser } = user
    return safeUser
  }
}
