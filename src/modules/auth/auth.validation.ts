import { z } from 'zod';
import { IndexValidation } from '../../validator/index.validation';

export class AuthValidation {
  static readonly REGISTER = z
    .object({
      username: IndexValidation.USERNAME,
      email: z.email().nonempty('Tidak boleh kosong'),
      password: IndexValidation.PASSWORD,
      confirmPassword: z.string().min(8, 'Minimal 8 karakter'),
      fullName: z
        .string()
        .min(3, 'Minimal 3 karakter')
        .max(100, 'Maksimal 100 karakter'),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Kata sandi tidak cocok',
      path: ['confirmPassword'],
    });

  static readonly LOGIN = z.object({
    identifier: IndexValidation.IDENTIFIER,
    password: z
      .string()
      .nonempty('Tidak boleh kosong')
      .min(8, 'Minimal 8 karakter'),
  });

  static readonly EMAIL_VERIFICATION = z.object({
    otpCode: z
      .string()
      .nonempty('Tidak boleh kosong')
      .length(6, 'Harus terdiri dari 6 digit')
      .regex(/^\d+$/, 'Hanya boleh berisi angka'),
  });

  static readonly FORGOT_PASSWORD = z.object({
    identifier: IndexValidation.IDENTIFIER,
  });

  static readonly RESET_PASSWORD = z
    .object({
      token: z
        .string()
        .nonempty('Tidak boleh kosong')
        .regex(
          /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/,
          'Format token tidak valid',
        ),
      newPassword: IndexValidation.PASSWORD,
      confirmPassword: z
        .string()
        .nonempty('Tidak boleh kosong')
        .min(8, 'Minimal 8 karakter'),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: 'Kata sandi tidak cocok',
      path: ['confirmPassword'],
    });

  static readonly REFRESH_TOKEN = z.object({
    refreshToken: z
      .string()
      .nonempty('Tidak boleh kosong')
      .regex(
        /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/,
        'Format token tidak valid',
      ),
  });
}

export type Login = z.infer<typeof AuthValidation.LOGIN>;
export type Register = z.infer<typeof AuthValidation.REGISTER>;
export type EmailVerification = z.infer<
  typeof AuthValidation.EMAIL_VERIFICATION
>;
export type ForgotPassword = z.infer<typeof AuthValidation.FORGOT_PASSWORD>;
export type ResetPassword = z.infer<typeof AuthValidation.RESET_PASSWORD>;
export type RefreshToken = z.infer<typeof AuthValidation.REFRESH_TOKEN>;
