import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { UserRole, UserStatus } from '../user.entity';

export class CreateUserDto {
  @IsEmail({}, { message: 'Invalid email format' })
  email!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName!: string;

  @IsNumber()
  companyId: number;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsEnum(UserRole)
  role!: UserRole;

  @IsEnum(UserStatus)
  status!: UserStatus;
}
