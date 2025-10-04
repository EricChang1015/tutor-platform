import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({
      description: '使用者名稱（電子郵件）',
      example: 'admin@example.com'
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
      description: '密碼',
      example: 'password'
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
