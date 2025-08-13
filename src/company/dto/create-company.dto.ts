import { IsNotEmpty, IsString, Length, IsOptional } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name: string;

  @IsOptional()
  @IsString()
  logo?: string;
}
