import { z } from 'zod';

export class VaccineValidation {
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
    name: z
      .string()
      .min(3, 'Minimal 3 karakter')
      .max(50, 'Maksimal 50 karakter')
      .nonempty('Nama tidak boleh kosong'),
    description: z
      .string()
      .max(500, 'Maksimal 500 karakter')
      .optional()
      .nullable(),
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

export type CreateVaccine = z.infer<typeof VaccineValidation.CREATE>;
export type UpdateVaccine = z.infer<typeof VaccineValidation.UPDATE>;
export type GetAllVaccine = z.infer<typeof VaccineValidation.GET_ALL>;
export type CheckCodeVaccine = z.infer<typeof VaccineValidation.CHECK_CODE>;
