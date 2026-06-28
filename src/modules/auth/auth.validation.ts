import { z } from 'zod';

const identifier = z
  .string()
  .min(3, 'Indentifier must be at least 3 characters long')
  .refine(
    (value) =>
      /^[a-zA-Z0-9_]+$/.test(value) ||
      /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value),
    {
      message: 'Identifier must be a valid email or username',
    },
  );

const password = z
  .string()
  .min(8, 'Minimal 8 karakter')
  .max(64, 'Maksimal 64 karakter')
  .regex(/[A-Z]/, 'Setidaknya berisi satu huruf kapital')
  .regex(/[a-z]/, 'Setidaknya berisi satu huruf kecil')
  .regex(/[0-9]/, 'Setidaknya berisi satu angka')
  .regex(/[@$!%*?&]/, 'Setidaknya berisi satu spesial karakter (@$!%*?&)');

export class AuthValidation {
  static readonly REGISTER = z
    .object({
      username: z
        .string()
        .min(3, 'Minimal 3 karakter')
        .max(20, 'Maksimal 20 karakter')
        .regex(
          /^(?!_)(?!.*__)[a-zA-Z0-9_]+(?<!_)$/,
          'Hanya boleh berisi huruf, angka, dan garis bawah, tetapi tidak boleh dimulai atau diakhiri dengan garis bawah',
        ),
      email: z.email().nonempty('Tidak boleh kosong'),
      password,
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
    identifier,
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
    identifier,
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

      newPassword: password,

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
    refreshToken: z.string().nonempty('Tidak boleh kosong'),
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
