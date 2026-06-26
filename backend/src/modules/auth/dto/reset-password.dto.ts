import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class ResetPasswordDto {
    @ApiProperty({ example: 'abc123...', description: 'Token đặt lại mật khẩu' })
    @IsString({ message: 'Token phải là chuỗi ký tự' })
    @IsNotEmpty({ message: 'Token không được để trống' })
    token: string

    @ApiProperty({ example: 'reader@example.com', description: 'Email tài khoản' })
    @IsEmail({}, { message: 'Email không hợp lệ' })
    @IsNotEmpty({ message: 'Email không được để trống' })
    email: string

    @ApiProperty({ example: 'newpassword123', description: 'Mật khẩu mới (tối thiểu 8 ký tự)' })
    @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
    @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
    @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
    password: string
}
