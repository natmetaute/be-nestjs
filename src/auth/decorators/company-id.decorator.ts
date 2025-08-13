import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

interface JwtUser {
  userId: number;
  email: string;
  role: string;
  companyId: number;
}

export const CompanyId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): number => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as JwtUser;

    if (!user || typeof user.companyId !== 'number') {
      throw new Error('Company ID not found in JWT');
    }

    return user.companyId;
  },
);
