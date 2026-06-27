import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
  JwtService as NestJwtService,
  TokenExpiredError,
  JsonWebTokenError,
  JwtSignOptions,
} from '@nestjs/jwt';
import { JwtPayload } from '../types';

@Injectable()
export class JwtService {
  constructor(private jwt: NestJwtService) {}

  createToken(payload: JwtPayload, expiresIn?: JwtSignOptions['expiresIn']) {
    return this.jwt.sign(payload, {
      ...(expiresIn && { expiresIn }),
    });
  }

  async verifyToken(token: string, type: JwtPayload['type']) {
    try {
      const data = await this.jwt.verifyAsync<JwtPayload>(token);
      if (data.type !== type) {
        throw new UnauthorizedException('Invalid token type');
      }
      return data;
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException('Token has expired');
      } else if (error instanceof JsonWebTokenError) {
        throw new UnauthorizedException('Invalid token');
      } else {
        throw error;
      }
    }
  }
}
