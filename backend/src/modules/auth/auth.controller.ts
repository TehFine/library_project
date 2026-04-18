import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@Controller('auth')
export class AuthController {
    constructor(private auth: AuthService) { }

    @Post('login')
    login(@Body() body: { email: string; password: string }) {
        return this.auth.login(body.email, body.password)
    }

    @Post('register')
    register(@Body() body: any) {
        return this.auth.register(body)
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    me(@Req() req: any) {
        return this.auth.getMe(req.user.userId)
    }
}