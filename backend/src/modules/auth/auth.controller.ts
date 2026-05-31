import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'

@ApiTags('Auth - Xác thực')
@Controller('auth')
export class AuthController {
    constructor(private auth: AuthService) { }

    @Post('login')
    @ApiOperation({ summary: 'Đăng nhập', description: 'Đăng nhập với email và mật khẩu, nhận JWT token' })
    @ApiBody({ schema: { example: { email: 'admin@library.vn', password: 'password123' } } })
    @ApiResponse({ status: 201, description: 'Đăng nhập thành công, trả về access_token' })
    @ApiResponse({ status: 401, description: 'Email hoặc mật khẩu không đúng' })
    login(@Body() body: { email: string; password: string }) {
        return this.auth.login(body.email, body.password)
    }

    @Post('register')
    @ApiOperation({ summary: 'Đăng ký', description: 'Đăng ký tài khoản độc giả mới' })
    @ApiBody({ schema: { example: { email: 'user@example.com', password: 'password123', fullName: 'Nguyễn Văn A' } } })
    @ApiResponse({ status: 201, description: 'Đăng ký thành công' })
    @ApiResponse({ status: 400, description: 'Email đã tồn tại hoặc dữ liệu không hợp lệ' })
    register(@Body() body: any) {
        return this.auth.register(body)
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
    @ApiBody({ schema: { example: { email: 'reader@example.com' } } })
    @ApiResponse({ status: 201, description: 'Email đặt lại mật khẩu đã được gửi (nếu email tồn tại)' })
    forgotPassword(@Body() body: { email: string }) {
        return this.auth.forgotPassword(body.email)
    }

    @Post('reset-password')
    @ApiOperation({ summary: 'Đặt lại mật khẩu', description: 'Đặt lại mật khẩu với token từ email' })
    @ApiBody({ schema: { example: { token: 'abc123', email: 'reader@example.com', password: 'newpassword123' } } })
    @ApiResponse({ status: 201, description: 'Mật khẩu đã được đặt lại thành công' })
    @ApiResponse({ status: 400, description: 'Token không hợp lệ hoặc đã hết hạn' })
    resetPassword(@Body() body: { token: string; email: string; password: string }) {
        return this.auth.resetPassword(body.token, body.email, body.password)
    }
}
