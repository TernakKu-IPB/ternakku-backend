import z from 'zod';

export class IndexValidation {
  static readonly IDENTIFIER = z
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

  static readonly PASSWORD = z
    .string()
    .min(8, 'Minimal 8 karakter')
    .max(64, 'Maksimal 64 karakter')
    .regex(/[A-Z]/, 'Setidaknya berisi satu huruf kapital')
    .regex(/[a-z]/, 'Setidaknya berisi satu huruf kecil')
    .regex(/[0-9]/, 'Setidaknya berisi satu angka')
    .regex(/[@$!%*?&]/, 'Setidaknya berisi satu spesial karakter (@$!%*?&)');

  static readonly DATE = z.iso.date(
    'Format tanggal tidak valid. Gunakan TTTT-BB-HH',
  );

  static readonly OPTIONAL_DATE = z.iso
    .date('Format tanggal tidak valid. Gunakan TTTT-BB-HH')
    .or(z.literal(''))
    .transform((value) => (value === '' ? null : value))
    .nullable();

  static readonly DATE_TIME = z.iso.datetime(
    'Format tanggal ISO tidak valid. Gunakan TTTT-BB-HHTjj:mm:dd.dddZ',
  );

  static readonly OPTIONAL_DATE_TIME = z.iso
    .datetime(
      'Format tanggal ISO tidak valid. Gunakan TTTT-BB-HHTjj:mm:dd.dddZ',
    )
    .or(z.literal(''))
    .transform((value) => (value === '' ? null : value))
    .nullable();

  static readonly USERNAME = z
    .string()
    .min(3, 'Minimal 3 karakter')
    .max(20, 'Maksimal 20 karakter')
    .regex(
      /^(?!_)(?!.*__)[a-zA-Z0-9_]+(?<!_)$/,
      'Hanya boleh berisi huruf, angka, dan garis bawah, tetapi tidak boleh dimulai atau diakhiri dengan garis bawah',
    );
}
