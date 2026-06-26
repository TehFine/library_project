import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { ForgotPasswordDto } from './dto/forgot-password.dto'
import { ResetPasswordDto } from './dto/reset-password.dto'

@ApiTags('Auth - Xác thực')
@Controller('auth')
export class AuthController {
    constructor(private auth: AuthService) { }

    @Post('login')
    @ApiOperation({ summary: 'Đăng nhập', description: 'Đăng nhập với email và mật khẩu, nhận JWT token' })
    @ApiResponse({ status: 201, description: 'Đăng nhập thành công, trả về access_token' })
    @ApiResponse({ status: 401, description: 'Email hoặc mật khẩu không đúng' })
    login(@Body() dto: LoginDto) {
        return this.auth.login(dto.email, dto.password)
    }

    @Post('register')
    @ApiOperation({ summary: 'Đăng ký', description: 'Đăng ký tài khoản độc giả mới' })
    @ApiResponse({ status: 201, description: 'Đăng ký thành công' })
    @ApiResponse({ status: 400, description: 'Email đã tồn tại hoặc dữ liệu không hợp lệ' })
    register(@Body() dto: RegisterDto) {
        return this.auth.register(dto)
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Thông tin cá nhân', description: 'Lấy thông tin người dùng hiện tại từ token' })
    @ApiResponse({ status: 200, description: 'Trả về thông tin người dùng' })
    @ApiResponse({ status: 401, description: 'Token không hợp lệ' })
    me(@Req() req: any) {
        return this.auth.getMe(req.user.userId)
    }

    @Post('forgot-password')
    @ApiOperation({ summary: 'Quên mật khẩu', description: 'Gửi email đặt lại mật khẩu' })
    @ApiResponse({ status: 201, description: 'Email đặt lại mật khẩu đã được gửi (nếu email tồn tại)' })
    forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.auth.forgotPassword(dto.email)
    }

    @Post('reset-password')
    @ApiOperation({ summary: 'Đặt lại mật khẩu', description: 'Đặt lại mật khẩu với token từ email' })
    @ApiResponse({ status: 201, description: 'Mật khẩu đã được đặt lại thành công' })
    @ApiResponse({ status: 400, description: 'Token không hợp lệ hoặc đã hết hạn' })
    resetPassword(@Body() dto: ResetPasswordDto) {
        return this.auth.resetPassword(dto.token, dto.email, dto.password)
    }
}
