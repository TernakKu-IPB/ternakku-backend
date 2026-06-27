import {
  BadRequestException,
  ConflictException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { User } from '../user/user.model';
import bcrypt from 'bcrypt';
import cryptoRandomString from 'crypto-random-string';
import { Prisma } from '../../generated/prisma/client';
import { MailService } from '../../common/mail.service';
import { ConfigService } from '@nestjs/config';
import { Login, Register, ResetPassword } from './auth.validation';
import { JwtService } from '../../common/jwt.service';

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

  maskString(string: string) {
    const length = string.length;
    if (length <= 2) {
      return string[0] + '*'.repeat(length - 1);
    } else if (length <= 3) {
      return string[0] + '*'.repeat(length - 2) + string.slice(-1);
    } else {
      return string.slice(0, 2) + '*'.repeat(length - 3) + string.slice(-1);
    }
  }

  // API function

  async register(data: Register): Promise<{ accessToken: string }> {
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
        select: {
          id: true,
        },
      });

      await this.mail.sendEmail({
        to: data.email,
        subject: `${this.config.get('APP_NAME', 'TernakKu')} - Verifikasi Email`,
        template: 'otp-register',
        context: { otp: otpCode },
      });

      return {
        accessToken: this.jwt.createToken({
          sub: user.id,
          type: 'access_token',
        }),
      };
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException(
          'Nama pengguna atau email sudah digunakan.',
        );
      }

      throw err;
    }
  }

  async login(
    data: Login,
  ): Promise<{ accessToken: string; isVerified: User['isVerified'] }> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: data.identifier }, { email: data.identifier }],
      },
      select: {
        id: true,
        password: true,
        isVerified: true,
      },
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
      accessToken: this.jwt.createToken({
        sub: user.id,
        type: 'access_token',
      }),
      isVerified: user.isVerified,
    };
  }

  async verifyEmail(
    id: number,
    otpCode: string,
  ): Promise<{ isVerified: User['isVerified'] }> {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          id,
          otpCode,
        },
        select: {
          otpExpiration: true,
        },
      });
      if (!user) {
        throw new BadRequestException('Invalid otp code or account');
      }

      const isOTPExpired = dayjs().isAfter(dayjs(user.otpExpiration));
      if (isOTPExpired) {
        throw new GoneException('OTP code has expired');
      }

      const verifiedUser = await this.prisma.user.update({
        where: {
          id: id,
        },
        data: {
          isVerified: true,
        },
        select: {
          isVerified: true,
        },
      });

      return {
        isVerified: verifiedUser.isVerified,
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

  async resendVerification(id: number): Promise<{ email: string }> {
    const otpCode = cryptoRandomString({ length: 6, type: 'numeric' });
    const otpExpiration = dayjs().add(10, 'minute').toISOString();
    const user = await this.prisma.user.update({
      where: {
        id,
      },
      data: {
        otpCode,
        otpExpiration,
      },
      select: {
        email: true,
      },
    });

    if (!user.email) {
      throw new NotFoundException('Email address not found');
    }

    await this.mail.sendEmail({
      to: user.email,
      subject: `${this.config.get('APP_NAME', 'TernakKu')} - Verifikasi Email`,
      template: 'otp-register',
      context: { otp: otpCode },
    });

    const [local, domain] = user.email.split('@');
    if (!local || !domain)
      throw new BadRequestException('Invalid email address');
    const maksedEmail = `${this.maskString(local)}@${domain}`;

    return {
      email: maksedEmail,
    };
  }

  async forgotPassword(
    identifier: string,
  ): Promise<{ email: string; username: string }> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: identifier }, { email: identifier }],
      },
      select: {
        id: true,
        username: true,
        email: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.email) {
      throw new NotFoundException('Email address not found');
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
    if (!local || !domain)
      throw new BadRequestException('Invalid email address');
    const maksedEmail = `${this.maskString(local)}@${domain}`;
    const maskedUsername = this.maskString(user.username);

    return {
      email: maksedEmail,
      username: maskedUsername,
    };
  }

  async resetPassword(data: ResetPassword): Promise<{ accessToken: string }> {
    try {
      const payload = await this.jwt.verifyToken(data.token, 'reset_password');

      const hashedPassword = await bcrypt.hash(
        data.newPassword,
        this.SALT_ROUNDS,
      );
      const user = await this.prisma.user.update({
        where: {
          id: payload.sub,
        },
        data: {
          password: hashedPassword,
        },
        select: {
          id: true,
        },
      });

      return {
        accessToken: this.jwt.createToken({
          sub: user.id,
          type: 'access_token',
        }),
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
