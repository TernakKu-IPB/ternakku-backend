import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Request } from 'express';
import { AuthValidation } from './auth.validation';
import type {
  EmailVerification,
  ForgotPassword,
  Login,
  Register,
  ResetPassword,
} from './auth.validation';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { JwtPayload } from '../../types';
import type { ApiResponse } from '../../types';
import type { User } from '../user/user.model';
import { Throttle } from '@nestjs/throttler';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { AuthGuard } from './guard/auth.guard';

dayjs.extend(duration);

@Controller('auth')
export class AuthController {
  constructor(private service: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body(new ZodValidationPipe(AuthValidation.REGISTER)) data: Register,
  ): Promise<ApiResponse<{ accessToken: string }>> {
    const user = await this.service.register(data);
    return {
      message:
        'Pendaftaran akun berhasil. Kode OTP telah dikirim ke email Anda',
      data: user,
      statusCode: HttpStatus.CREATED,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ZodValidationPipe(AuthValidation.LOGIN)) data: Login,
  ): Promise<ApiResponse<{ accessToken: string; isVerified: boolean }>> {
    const user = await this.service.login(data);
    return {
      message: `Berhasil masuk${user.isVerified ? '' : '. Akun belum terverifikasi'}`,
      data: user,
      statusCode: HttpStatus.OK,
    };
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  async verifyEmail(
    @Body(new ZodValidationPipe(AuthValidation.EMAIL_VERIFICATION))
    data: EmailVerification,
    @Req() req: Request & { user: JwtPayload },
  ): Promise<ApiResponse<{ isVerified: User['isVerified'] }>> {
    const user = await this.service.verifyEmail(req.user.sub, data.otpCode);
    return {
      message: 'Verifikasi akun berhasil',
      data: user,
      statusCode: HttpStatus.OK,
    };
  }

  @Post('resend-verification')
  @Throttle({
    default: {
      ttl: 60000,
      limit: 1,
    },
  })
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  async resendVerification(
    @Req() req: Request & { user: JwtPayload },
  ): Promise<ApiResponse<{ email: string }>> {
    const user = await this.service.resendVerification(req.user.sub);
    return {
      message: `Kode OTP telah dikirim ke ${user.email}`,
      data: user,
      statusCode: HttpStatus.OK,
    };
  }

  @Post('forgot-password')
  @Throttle({
    default: {
      ttl: 60000,
      limit: 1,
    },
  })
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body(new ZodValidationPipe(AuthValidation.FORGOT_PASSWORD))
    data: ForgotPassword,
  ): Promise<ApiResponse<{ email: string; username: string }>> {
    const user = await this.service.forgotPassword(data.identifier);
    return {
      message: `Tautan atur ulang kata sandi telah dikirim ke ${user.email}`,
      data: user,
      statusCode: HttpStatus.OK,
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body(new ZodValidationPipe(AuthValidation.RESET_PASSWORD))
    data: ResetPassword,
  ): Promise<ApiResponse<{ accessToken: string }>> {
    const user = await this.service.resetPassword(data);
    return {
      message: 'Kata sandi berhasil diatur ulang',
      data: user,
      statusCode: HttpStatus.OK,
    };
  }
}
