import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../users/user.entity';
import { SignupDto } from './dto/signup.dto';
import { MailService } from '../mail/mail.service';

type AuthUser = Pick<User, 'id' | 'email' | 'role'>;

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async validateUser(
    email: string,
    pass: string,
  ): Promise<Omit<User, 'password'> | null> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: AuthUser) {
    const dbUser = await this.usersService.findById(user.id);
    if (!dbUser) {
      throw new NotFoundException('User not found');
    }

    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async loginFromCredentials(email: string, password: string) {
    const safeUser = await this.validateUser(email, password); // Omit<User,'password'> | null
    if (!safeUser) throw new UnauthorizedException('Invalid credentials');
    // safeUser has id: number (not undefined), so it satisfies AuthUser
    return this.login(safeUser);
  }

  async register(signupDto: SignupDto) {
    const existing = await this.usersService.findByEmail(signupDto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(signupDto.password, 10);
    const user = await this.usersService.create({
      ...signupDto,
      password: hashedPassword,
      role: UserRole.User,
    });

    await this.mailService.sendWelcomeEmail(user.email, user.firstName);

    return user;
  }
}
