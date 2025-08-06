import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Ip,
  Headers,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit-log.entity';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { SignupDto } from './dto/signup.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly auditService: AuditService,
  ) {}

  @Post('login')
  async login(
    @Body() { email, password }: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
  ) {
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      await this.auditService.log({
        action: AuditAction.AUTH_LOGIN_FAILED,
        entity: 'Auth',
        entityId: 'login',
        userEmail: email,
        changes: { ip, ua },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.auditService.log({
      action: AuditAction.AUTH_LOGIN,
      entity: 'User',
      entityId: user.id,
      userEmail: user.email,
      changes: { ip, ua },
    });

    return this.authService.login({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  async logout(
    @Req() req: Request & { user: { userId: number; email?: string } },
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
  ) {
    await this.auditService.log({
      action: AuditAction.AUTH_LOGOUT,
      entity: 'User',
      entityId: req.user.userId,
      userEmail: req.user.email ?? null,
      changes: { ip, ua },
    });
    return { ok: true };
  }

  @Post('signup')
  async signup(
    @Body() signupDto: SignupDto,
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
  ) {
    const user = await this.authService.register(signupDto);

    await this.auditService.log({
      action: AuditAction.AUTH_REGISTER,
      entity: 'User',
      entityId: user.id,
      userEmail: user.email,
      changes: { ip, ua },
    });

    return this.authService.login({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  }
}
