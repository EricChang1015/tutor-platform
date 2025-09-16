import { IsInt, IsOptional, IsString, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateAvailabilityDto {
  @IsInt()
  @Min(0)
  @Max(6)
  weekday: number; // 0=Sunday, 1=Monday, ..., 6=Saturday

  @IsString()
  start_time: string; // HH:MM format

  @IsString()
  end_time: string; // HH:MM format

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsString()
  effective_from?: string; // YYYY-MM-DD format

  @IsOptional()
  @IsString()
  effective_to?: string; // YYYY-MM-DD format
}
