import { z } from 'zod';
import { IndexValidation } from '../../validator/index.validation';
import { Gender } from '../../generated/prisma/enums';

export class UserValidation {
  private static genderValues = Object.values(Gender);

  static readonly UPDATE_PROFILE = z.object({
    fullName: z.string().min(3, 'Minimal 3 karakter').optional(),
    gender: z
      .enum(Gender, {
        error: `Harus salah satu dari: ${this.genderValues.join(', ')}`,
      })
      .or(z.literal(''))
      .transform((value) => (value === '' ? null : value))
      .nullable()
      .optional(),
    birthDate: IndexValidation.OPTIONAL_DATE.optional(),
    picture: z
      .url('Format URL gambar tidak valid')
      .or(z.literal(''))
      .transform((value) => (value === '' ? null : value))
      .nullable()
      .optional(),
  });
}

export type UpdateUserProfile = z.infer<typeof UserValidation.UPDATE_PROFILE>;
