import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import bcrypt from 'bcrypt';
import cryptoRandomString from 'crypto-random-string';
import { Prisma } from '../../generated/prisma/client';
import { MailService } from '../../common/mail.service';
import { ConfigService } from '@nestjs/config';
import {
  Login,
  RefreshToken,
  Register,
  ResetPassword,
} from './auth.validation';
import { JwtService } from '../../common/jwt.service';
import { Auth } from './auth.model';

dayjs.extend(duration);

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 10;
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  private maskString(string: string) {
    const length = string.length;
    if (length <= 2) {
      return string[0] + '*'.repeat(length - 1);
    } else if (length <= 3) {
      return string[0] + '*'.repeat(length - 2) + string.slice(-1);
    } else {
      return string.slice(0, 2) + '*'.repeat(length - 3) + string.slice(-1);
    }
  }

  private getAccessToken(userId: number): string {
    return this.jwt.createToken(
      { sub: userId, type: 'access_token' },
      this.config.get('ACCESS_TOKEN_EXPIRATION', '1h'),
    );
  }

  private async getAndUpdateRefreshToken(userId: number): Promise<string> {
    const refreshToken = this.jwt.createToken(
      { sub: userId, type: 'refresh_token' },
      this.config.get('REFRESH_TOKEN_EXPIRATION', '28d'),
    );

    const hashedRefreshToken = await bcrypt.hash(
      refreshToken,
      this.SALT_ROUNDS,
    );
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRefreshToken },
      select: { id: true },
    });

    return refreshToken;
  }

  // API function

  async register(data: Register): Promise<Auth> {
    try {
      const hashedPassword = await bcrypt.hash(data.password, this.SALT_ROUNDS);
      const otpCode = cryptoRandomString({ length: 6, type: 'numeric' });
      const otpExpiration = dayjs().add(10, 'minute').toISOString();
      const user = await this.prisma.user.create({
        data: {
          username: data.username,
          email: data.email,
          password: hashedPassword,
          fullName: data.fullName,
          otpCode,
          otpExpiration,
        },
        select: { id: true, isVerified: true },
      });

      await this.mail.sendEmail({
        to: data.email,
        subject: `${this.config.get('APP_NAME', 'TernakKu')} - Verifikasi Email`,
        template: 'otp-register',
        context: { otp: otpCode },
      });

      return {
        accessToken: this.getAccessToken(user.id),
        refreshToken: await this.getAndUpdateRefreshToken(user.id),
        isVerified: user.isVerified,
      };
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException('Nama pengguna atau email sudah digunakan');
      }

      throw err;
    }
  }

  async login(data: Login): Promise<Auth> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: data.identifier }, { email: data.identifier }],
      },
      select: { id: true, password: true, isVerified: true },
    });

    if (!user) {
      throw new NotFoundException('Email atau kata sandi salah');
    }

    const isPasswordValid = user.password
      ? await bcrypt.compare(data.password, user.password)
      : false;

    if (!isPasswordValid) {
      throw new NotFoundException('Email atau kata sandi salah');
    }

    return {
      accessToken: this.getAccessToken(user.id),
      refreshToken: await this.getAndUpdateRefreshToken(user.id),
      isVerified: user.isVerified,
    };
  }

  async refreshToken(data: RefreshToken): Promise<Auth> {
    const payload = await this.jwt.verifyToken(
      data.refreshToken,
      'refresh_token',
    );

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, refreshToken: true, isVerified: true },
    });

    if (!user || !user.refreshToken) {
      throw new ForbiddenException('Sesi telah berakhir');
    }

    const refreshTokenMatches = await bcrypt.compare(
      data.refreshToken,
      user.refreshToken,
    );
    if (!refreshTokenMatches) {
      throw new ForbiddenException('Sesi telah berakhir');
    }

    return {
      accessToken: this.getAccessToken(user.id),
      refreshToken: data.refreshToken,
      isVerified: user.isVerified,
    };
  }

  async logout(userId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    return true;
  }

  async verifyEmail(
    id: number,
    otpCode: string,
  ): Promise<{ isVerified: boolean }> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id, otpCode },
        select: { otpExpiration: true },
      });
      if (!user) {
        throw new BadRequestException('Kode OTP atau akun tidak valid');
      }

      const isOTPExpired = dayjs().isAfter(dayjs(user.otpExpiration));
      if (isOTPExpired) {
        throw new GoneException('Kode OTP sudah kedaluwarsa');
      }

      const verifiedUser = await this.prisma.user.update({
        where: { id },
        data: { isVerified: true },
        select: { isVerified: true },
      });

      return {
        isVerified: verifiedUser.isVerified,
      };
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2025'
      ) {
        throw new NotFoundException('Akun tidak ditemukan');
      }
      throw err;
    }
  }

  async resendVerification(id: number): Promise<{ email: string }> {
    try {
      const otpCode = cryptoRandomString({ length: 6, type: 'numeric' });
      const otpExpiration = dayjs().add(10, 'minute').toISOString();
      const user = await this.prisma.user.update({
        where: { id },
        data: { otpCode, otpExpiration },
        select: { email: true, isVerified: true },
      });

      if (user.isVerified) {
        throw new UnprocessableEntityException('Akun sudah terverifikasi');
      }

      await this.mail.sendEmail({
        to: user.email,
        subject: `${this.config.get('APP_NAME', 'TernakKu')} - Verifikasi Email`,
        template: 'otp-register',
        context: { otp: otpCode },
      });

      const [local, domain] = user.email.split('@');
      if (!local || !domain) throw new BadRequestException('Email tidak valid');
      const maksedEmail = `${this.maskString(local)}@${domain}`;

      return {
        email: maksedEmail,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError)
        if (error.code === 'P2025') {
          throw new NotFoundException('Akun tidak ditemukan');
        }
      throw error;
    }
  }

  async forgotPassword(
    identifier: string,
  ): Promise<{ email: string; username: string }> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: identifier }, { email: identifier }],
      },
      select: { id: true, username: true, email: true },
    });
    if (!user) {
      throw new NotFoundException('Akun tidak ditemukan');
    }

    const token = this.jwt.createToken(
      {
        sub: user.id,
        type: 'reset_password',
      },
      '10m',
    );
    const clientUrl = this.config.get<string>(
      'CLIENT_URL',
      'http://localhost:5173',
    );
    const resetPasswordLink = `${clientUrl}/auth/forgot-password?token=${token}`;

    await this.mail.sendEmail({
      to: user.email,
      subject: `${this.config.get('APP_NAME', 'TernakKu')} - Atur Ulang Kata Sandi`,
      template: 'reset-password',
      context: { resetLink: resetPasswordLink },
    });

    const [local, domain] = user.email.split('@');
    if (!local || !domain) throw new BadRequestException('Email tidak valid');
    const maksedEmail = `${this.maskString(local)}@${domain}`;
    const maskedUsername = this.maskString(user.username);

    return {
      email: maksedEmail,
      username: maskedUsername,
    };
  }

  async resetPassword(data: ResetPassword): Promise<Auth> {
    try {
      const payload = await this.jwt.verifyToken(data.token, 'reset_password');

      const hashedPassword = await bcrypt.hash(
        data.newPassword,
        this.SALT_ROUNDS,
      );
      const user = await this.prisma.user.update({
        where: { id: payload.sub },
        data: { password: hashedPassword },
        select: { id: true, isVerified: true },
      });

      return {
        accessToken: this.getAccessToken(user.id),
        refreshToken: await this.getAndUpdateRefreshToken(user.id),
        isVerified: user.isVerified,
      };
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2025'
      ) {
        throw new NotFoundException('User not found');
      }

      throw err;
    }
  }
}
