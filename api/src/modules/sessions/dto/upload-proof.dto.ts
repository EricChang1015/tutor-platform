import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';

export enum ProofType {
  SCREENSHOT = 'screenshot',
  RECORDING = 'recording',
  DOCUMENT = 'document',
}

export class UploadProofDto {
  @IsEnum(ProofType)
  type: ProofType;

  @IsString()
  url: string;

  @IsOptional()
  @IsObject()
  meta?: any;
}
