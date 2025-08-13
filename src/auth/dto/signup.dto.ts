import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class SignupDto {
  @IsEmail({}, { message: 'Invalid email format' })
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(50)
  companyName: string;
}
