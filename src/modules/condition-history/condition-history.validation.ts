import { z } from 'zod';
import { IndexValidation } from '../../validator/index.validation';

export class ConditionHistoryValidation {
  static readonly CREATE = z.object({
    livestockId: z.number().int().positive('Pilihan tidak valid'),
    conditionTypeId: z.number().int().positive('Pilihan tidak valid'),
    recordDate: IndexValidation.DATE,
    notes: z
      .string()
      .or(z.literal(''))
      .transform((value) => (value === '' ? null : value))
      .nullable()
      .optional(),
  });

  static readonly UPDATE = this.CREATE.partial();

  static readonly GET_ALL = z.object({
    limit: z.coerce.number().min(1).default(10),
    offset: z.coerce.number().min(0).default(0),
    livestockId: z.coerce
      .number()
      .int()
      .positive()
      .or(z.literal(''))
      .transform((val) => (val === '' ? undefined : val))
      .optional(),
    conditionTypeId: z.coerce
      .number()
      .int()
      .positive()
      .or(z.literal(''))
      .transform((val) => (val === '' ? undefined : val))
      .optional(),
    startDate: IndexValidation.OPTIONAL_DATE.optional(),
    endDate: IndexValidation.OPTIONAL_DATE.optional(),
  });
}

export type CreateConditionHistory = z.infer<
  typeof ConditionHistoryValidation.CREATE
>;
export type UpdateConditionHistory = z.infer<
  typeof ConditionHistoryValidation.UPDATE
>;
export type GetAllConditionHistory = z.infer<
  typeof ConditionHistoryValidation.GET_ALL
>;
