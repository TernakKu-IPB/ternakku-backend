import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '../../../common/jwt.service';
import { JwtPayload } from '../../../types';
import { Reflector } from '@nestjs/core';
import { VerifiedAccount } from '../decorator/verified-account.decarator';
import { PrismaService } from '../../../common/prisma.service';
import { Role } from '../decorator/role.decarator';
import { Role as RolePrisma } from '../../../generated/prisma/enums';

@Injectable()
export abstract class BaseGuard implements CanActivate {
  protected abstract isAuthOptional: boolean;

  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: JwtPayload }>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      if (this.isAuthOptional) return true;
      throw new UnauthorizedException('Token tidak ditemukan.');
    }

    try {
      const data = await this.jwt.verifyToken(token, 'access_token');
      request.user = data;

      const shouldVerified = this.reflector.get(
        VerifiedAccount,
        context.getHandler(),
      );
      if (shouldVerified) {
        await this.checkAccountVerification(request.user);
      }

      const role = this.reflector.get(Role, context.getHandler());
      if (role) {
        await this.checkAuthorization(role, request.user);
      }

      return true;
    } catch (error) {
      if (this.isAuthOptional) return true;
      throw error;
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private async checkAccountVerification(user: JwtPayload) {
    const userFromDb = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { isVerified: true },
    });

    if (!userFromDb?.isVerified) {
      throw new ForbiddenException('Akun Anda belum terverifikasi.');
    }
  }

  private async checkAuthorization(role: RolePrisma, user: JwtPayload) {
    const userFromDB = await this.prisma.user.findUnique({
      where: {
        id: user.sub,
      },
      select: {
        role: true,
      },
    });

    if (!userFromDB || role !== userFromDB.role) {
      throw new ForbiddenException('Tidak dapat diakses');
    }
  }
}

@Injectable()
export class AuthGuard extends BaseGuard {
  protected isAuthOptional = false;
}

@Injectable()
export class OptionalAuthGuard extends BaseGuard {
  protected isAuthOptional = true;
}
