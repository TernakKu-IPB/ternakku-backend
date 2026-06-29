import { z } from 'zod';

export class ConditionTypeValidation {
  static readonly CREATE = z.object({
    code: z
      .string()
      .min(2, 'Minimal 2 karakter')
      .max(20, 'Maksimal 20 karakter')
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

export type CreateConditionType = z.infer<
  typeof ConditionTypeValidation.CREATE
>;
export type UpdateConditionType = z.infer<
  typeof ConditionTypeValidation.UPDATE
>;
export type GetAllConditionType = z.infer<
  typeof ConditionTypeValidation.GET_ALL
>;
export type CheckCodeConditionType = z.infer<
  typeof ConditionTypeValidation.CHECK_CODE
>;
