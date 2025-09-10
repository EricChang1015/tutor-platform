import { IsBooleanString, IsEnum, IsOptional, IsString } from 'class-validator';
import { Role } from '../../../common/roles.enum';
export class ListUsersDto {
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsBooleanString()
  active?: string; // 'true' | 'false'

  @IsOptional()
  @IsString()
  q?: string; // name/email contains
}