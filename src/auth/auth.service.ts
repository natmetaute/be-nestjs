import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { User, UserRole, UserStatus } from '../users/user.entity';
import { SignupDto } from './dto/signup.dto';
import { MailService } from '../mail/mail.service';
import { CompanyService } from 'src/company/company.service';

type AuthUser = Pick<User, 'id' | 'email' | 'role' | 'companyId'>;

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
    private companyService: CompanyService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.usersService.findByEmail(
      email,
    );

    if (!user) return null;

    const isValid: boolean = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async login(user: AuthUser) {
    const dbUser = await this.usersService.findById(user.id);
    if (!dbUser) {
      throw new NotFoundException('User not found');
    }

    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      companyId: user.companyId,
    };
    return {
      access_token: this.jwtService.sign(payload),
      role: user.role,
      companyId: user.companyId,
    };
  }

  async loginFromCredentials(
    email: string,
    password: string,
  ) {
    const safeUser = await this.validateUser(email, password);

    if (!safeUser) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.login(safeUser); // Now safeUser is guaranteed to be a User
  }

  async register(dto: SignupDto): Promise<User> {
    const { companyName, ...userData } = dto;

    const existingCompany = await this.companyService.findByName(companyName);

    if (existingCompany) {
      throw new BadRequestException(
        'Company already exists. Please ask the admin to add you.',
      );
    }

    const company = await this.companyService.createCompany(companyName);

    const user = await this.usersService.create({
      ...userData,
      role: UserRole.Admin, // First user is Admin by default
      companyId: company.id,
      password: await bcrypt.hash(dto.password, 10),
      status: UserStatus.Created,
    });

    return user;
  }
}
