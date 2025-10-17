import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayUnique, IsDateString, IsOptional, IsString, IsInt, Min, Max, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SetAvailabilityDto {
  @ApiProperty({ description: '教師ID（若為教師本人可省略）', required: false, example: '3ac75e02-e751-440d-a21a-ffe8f6f1b79b' })
  @IsString()
  @IsOptional()
  teacherId?: string;

  @ApiProperty({ description: '日期（IANA 時區對齊請由後端根據教師時區處理）', example: '2025-10-06', format: 'date' })
  @IsDateString()
  date!: string;

  @ApiProperty({ description: '時間槽索引陣列（每30分鐘一個槽，0..47）', example: [18,19,20,21,22,23,24,25,26,27,28,29,30,31] })
  @IsArray()
  @ArrayMinSize(0)
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(47, { each: true })
  timeSlots!: number[];
}

