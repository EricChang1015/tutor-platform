import { IsString, IsOptional, IsDateString } from 'class-validator';

export class GeneratePayoutDto {
  @IsString()
  teacher_id: string;

  @IsDateString()
  period_start: string; // YYYY-MM-DD format

  @IsDateString()
  period_end: string; // YYYY-MM-DD format

  @IsOptional()
  @IsString()
  notes?: string;
}
