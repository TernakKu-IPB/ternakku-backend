import { z } from 'zod';
import { Gender, LivestockStatus } from '../../generated/prisma/enums';
import { IndexValidation } from '../../validator/index.validation';

export class LivestockValidation {
  private static genderValues = Object.values(Gender);
  private static statusValues = Object.values(LivestockStatus);
  private static dataModel = z.object({
    tagId: z
      .string()
      .or(z.literal(''))
      .transform((value) => (value === '' ? null : value))
      .nullable()
      .optional(),
    name: z
      .string()
      .or(z.literal(''))
      .transform((value) => (value === '' ? null : value))
      .nullable()
      .optional(),
    picture: z
      .url('Format URL tidak valid')
      .or(z.literal(''))
      .transform((value) => (value === '' ? null : value))
      .nullable()
      .optional(),
    animalTypeId: z.number().int().positive('Pilihan tidak valid'),
    gender: z.enum(Gender, {
      error: `Harus salah satu dari: ${this.genderValues.join(', ')}`,
    }),
    birthDate: IndexValidation.OPTIONAL_DATE.optional(),
    status: z
      .enum(LivestockStatus, {
        error: `Harus salah satu dari: ${this.statusValues.join(', ')}`,
      })
      .default(LivestockStatus.active),
    fatherId: z
      .number()
      .int()
      .positive('Pilihan tidak valid')
      .nullable()
      .optional(),
    motherId: z
      .number()
      .int()
      .positive('Pilihan tidak valid')
      .nullable()
      .optional(),
  });

  static readonly CREATE = this.dataModel.refine(
    (data) => data.tagId || data.name,
    {
      message: 'Setidaknya nomor identitas atau nama harus diisi',
      path: ['tagId', 'name'],
    },
  );

  static readonly UPDATE = this.dataModel.partial();

  static readonly GET_ALL = z.object({
    limit: z.coerce.number().min(1).default(10),
    offset: z.coerce.number().min(0).default(0),
    q: z.string().optional(),
    status: z
      .enum(LivestockStatus, {
        error: `Harus salah satu dari: ${this.statusValues.join(', ')}`,
      })
      .or(z.literal(''))
      .transform((value) => (value === '' ? null : value))
      .nullable()
      .optional(),
    gender: z
      .enum(Gender, {
        error: `Harus salah satu dari: ${this.genderValues.join(', ')}`,
      })
      .or(z.literal(''))
      .transform((value) => (value === '' ? null : value))
      .nullable()
      .optional(),
    animalTypeId: z.coerce
      .number()
      .int()
      .positive('Pilihan tidak valid')
      .nullable()
      .optional(),
  });
}

export type CreateLivestock = z.infer<typeof LivestockValidation.CREATE>;
export type UpdateLivestock = z.infer<typeof LivestockValidation.UPDATE>;
export type GetAllLivestock = z.infer<typeof LivestockValidation.GET_ALL>;
