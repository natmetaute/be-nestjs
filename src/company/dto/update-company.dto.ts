import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @IsOptional()  
  @IsString()
  logo?: string; 
}
