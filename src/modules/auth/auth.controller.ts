import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Request, Response } from 'express';
import { AuthValidation } from './auth.validation';
import type {
  EmailVerification,
  ForgotPassword,
  Login,
  RefreshToken,
  Register,
  ResetPassword,
} from './auth.validation';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { JwtPayload } from '../../types';
import type { ApiResponse } from '../../types';
import { Throttle } from '@nestjs/throttler';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { AuthGuard } from './guard/auth.guard';
import { Auth } from './auth.model';

dayjs.extend(duration);

@Controller('auth')
export class AuthController {
  constructor(private service: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body(new ZodValidationPipe(AuthValidation.REGISTER)) data: Register,
  ): Promise<ApiResponse<Auth>> {
    const authData = await this.service.register(data);
    return {
      message:
        'Pendaftaran akun berhasil. Kode OTP telah dikirim ke email Anda',
      data: authData,
      statusCode: HttpStatus.CREATED,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ZodValidationPipe(AuthValidation.LOGIN)) data: Login,
  ): Promise<ApiResponse<Auth>> {
    const authData = await this.service.login(data);
    return {
      message: `Berhasil masuk${authData.isVerified ? '' : '. Akun belum terverifikasi'}`,
      data: authData,
      statusCode: HttpStatus.OK,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body(new ZodValidationPipe(AuthValidation.REFRESH_TOKEN))
    data: RefreshToken,
  ): Promise<ApiResponse<Auth>> {
    const authData = await this.service.refreshToken(data);
    return {
      message: 'Sesi berhasil diperbarui',
      data: authData,
      statusCode: HttpStatus.OK,
    };
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request & { user: JwtPayload },
  ): Promise<ApiResponse<boolean>> {
    const result = await this.service.logout(req.user.sub);
    return {
      message: 'Berhasil keluar',
      data: result,
      statusCode: HttpStatus.OK,
    };
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  async verifyEmail(
    @Req() req: Request & { user: JwtPayload },
    @Body(new ZodValidationPipe(AuthValidation.EMAIL_VERIFICATION))
    data: EmailVerification,
  ): Promise<ApiResponse<{ isVerified: boolean }>> {
    const result = await this.service.verifyEmail(req.user.sub, data.otpCode);
    return {
      message: 'Email berhasil diverifikasi',
      data: result,
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
    const result = await this.service.resendVerification(req.user.sub);
    return {
      message: `Kode OTP telah dikirim ulang ke ${result.email}`,
      data: result,
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
    const result = await this.service.forgotPassword(data.identifier);
    return {
      message: `Tautan atur ulang kata sandi telah dikirim ke ${result.email}`,
      data: result,
      statusCode: HttpStatus.OK,
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body(new ZodValidationPipe(AuthValidation.RESET_PASSWORD))
    data: ResetPassword,
  ): Promise<ApiResponse<Auth>> {
    const authData = await this.service.resetPassword(data);
    return {
      message: 'Kata sandi berhasil diatur ulang',
      data: authData,
      statusCode: HttpStatus.OK,
    };
  }

  @Get('redirect-app')
  redirectApp(@Query('token') token: string, @Res() res: Response) {
    // HTML Sederhana untuk menjembatani email dan aplikasi mobile
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
          <title>Membuka TernakKu...</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
              body { font-family: sans-serif; text-align: center; padding: 50px; }
              .btn { display: inline-block; padding: 12px 24px; background: #2B959F; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }
          </style>
      </head>
      <body>
          <h2>Mengarahkan ke Aplikasi TernakKu...</h2>
          <p>Jika aplikasi tidak terbuka secara otomatis, klik tombol di bawah ini:</p>
          <a href="ternakku://reset-password?token=${token}" class="btn">Buka Aplikasi TernakKu</a>

          <script>
              // Otomatis melempar ke aplikasi mobile saat web terbuka
              window.onload = function() {
                  window.location.href = "ternakku://reset-password?token=${token}";
              };
          </script>
      </body>
      </html>
    `;

    res.type('text/html').send(html);
  }
}
