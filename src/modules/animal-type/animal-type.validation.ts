import { z } from 'zod';

export class AnimalTypeValidation {
  static readonly CREATE = z.object({
    code: z
      .string()
      .min(2, 'Minimal 2 karakter')
      .max(100, 'Maksimal 100 karakter')
      .regex(
        /^(?!-)(?!.*--)[a-z0-9-]+(?<!-)$/,
        'Hanya boleh berisi huruf kecil, angka, dan tanda hubung (-), serta tidak boleh diawali, diakhiri, atau memiliki dua tanda hubung berturut-turut',
      )
      .nonempty('Kode tidak boleh kosong'),
    label: z
      .string()
      .min(3, 'Minimal 3 karakter')
      .max(50, 'Maksimal 50 karakter')
      .nonempty('Label tidak boleh kosong'),
  });

  static readonly UPDATE = this.CREATE.partial();

  static readonly GET_ALL = z.object({
    limit: z.coerce.number().min(1).default(10),
    offset: z.coerce.number().min(0).default(0),
    q: z.string().optional(),
  });

  static readonly CHECK_CODE = z.object({
    code: z.string().nonempty('Kode tidak boleh kosong'),
  });
}

export type CreateAnimalType = z.infer<typeof AnimalTypeValidation.CREATE>;
export type UpdateAnimalType = z.infer<typeof AnimalTypeValidation.UPDATE>;
export type GetAllAnimalType = z.infer<typeof AnimalTypeValidation.GET_ALL>;
export type CheckCodeAnimalType = z.infer<
  typeof AnimalTypeValidation.CHECK_CODE
>;
