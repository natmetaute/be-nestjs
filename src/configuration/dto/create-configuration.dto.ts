import { IsInt, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateConfigurationDto {
  @IsInt()
  companyId!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  // example: 'USD', 'EUR'
  currency!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  // example: 'en', 'pt', 'es'
  language!: string;
}
