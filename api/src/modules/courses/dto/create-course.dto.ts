import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  duration_min?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  default_price_cents?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

