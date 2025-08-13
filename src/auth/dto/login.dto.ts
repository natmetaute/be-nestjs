import { IsEmail, IsString, IsNumber } from 'class-validator';

export class LoginDto {
  @IsEmail() email!: string;
  @IsString() password!: string;
}
