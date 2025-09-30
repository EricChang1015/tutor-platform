import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: '刷新權杖' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
