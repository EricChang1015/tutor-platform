import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CancelBookingDto {
  @IsString()
  reason: string;

  @IsOptional()
  @IsBoolean()
  technical_issue?: boolean;
}
