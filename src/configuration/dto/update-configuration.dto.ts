import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateConfigurationDto {
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  language?: string;
}
