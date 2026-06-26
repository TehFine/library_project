import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, IsOptional, Matches } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class RegisterDto {
    @ApiProperty({ example: 'user@example.com', description: 'Email đăng ký' })
    @IsEmail({}, { message: 'Email không hợp lệ' })
    @IsNotEmpty({ message: 'Email không được để trống' })
    email: string

    @ApiProperty({ example: 'nguyenvana', description: 'Tên đăng nhập' })
    @IsString({ message: 'Tên đăng nhập phải là chuỗi ký tự' })
    @IsNotEmpty({ message: 'Tên đăng nhập không được để trống' })
    @MinLength(3, { message: 'Tên đăng nhập phải có ít nhất 3 ký tự' })
    @MaxLength(50, { message: 'Tên đăng nhập tối đa 50 ký tự' })
    username: string

    @ApiProperty({ example: 'password123', description: 'Mật khẩu (tối thiểu 8 ký tự)' })
    @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
    @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
    @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
    @MaxLength(100, { message: 'Mật khẩu tối đa 100 ký tự' })
    password: string

    @ApiPropertyOptional({ example: 'Nguyễn Văn A', description: 'Họ và tên' })
    @IsOptional()
    @IsString({ message: 'Họ tên phải là chuỗi ký tự' })
    @MaxLength(100, { message: 'Họ tên tối đa 100 ký tự' })
    fullName?: string

    @ApiPropertyOptional({ example: '0901234567', description: 'Số điện thoại' })
    @IsOptional()
    @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
    @Matches(/^(84|0[3|5|7|8|9])+([0-9]{8})$/, {
        message: 'Số điện thoại không hợp lệ (phải là số di động VN 10 số)',
    })
    phone?: string

    @ApiPropertyOptional({ example: '2000-01-15', description: 'Ngày sinh (YYYY-MM-DD)' })
    @IsOptional()
    @IsString({ message: 'Ngày sinh phải là chuỗi ký tự' })
    dateOfBirth?: string

    @ApiPropertyOptional({ example: '123 Đường ABC, TP.HCM', description: 'Địa chỉ' })
    @IsOptional()
    @IsString({ message: 'Địa chỉ phải là chuỗi ký tự' })
    @MaxLength(200, { message: 'Địa chỉ tối đa 200 ký tự' })
    address?: string
}
