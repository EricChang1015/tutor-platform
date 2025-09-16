import { IsString, IsEnum, IsOptional, IsInt, Min, Max } from 'class-validator';

export enum FileType {
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  AUDIO = 'audio',
}

export class GetUploadUrlDto {
  @IsString()
  filename: string;

  @IsEnum(FileType)
  file_type: FileType;

  @IsString()
  content_type: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100 * 1024 * 1024) // 100MB max
  file_size?: number;
}
