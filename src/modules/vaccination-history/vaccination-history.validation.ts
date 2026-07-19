import { z } from 'zod';
import { IndexValidation } from '../../validator/index.validation';
import dayjs from 'dayjs';

export class VaccinationHistoryValidation {
  private static dataModel = z.object({
    livestockId: z.number().int().positive('Pilihan tidak valid'),
    vaccineId: z.number().int().positive('Pilihan tidak valid'),
    isVaccinated: z.boolean().default(false),
    vaccinationDate: IndexValidation.DATE,
    batchNumber: z
      .string()
      .or(z.literal(''))
      .transform((value) => (value === '' ? null : value))
      .nullable()
      .optional(),
    notes: z
      .string()
      .or(z.literal(''))
      .transform((value) => (value === '' ? null : value))
      .nullable()
      .optional(),
  });
  static readonly CREATE = this.dataModel.refine(
    (data) => {
      if (data.isVaccinated) {
        const isFuture = dayjs(data.vaccinationDate).isAfter(dayjs(), 'day');
        return !isFuture;
      }
      return true;
    },
    {
      message:
        'Status sudah divaksin hanya berlaku jika tanggal vaksinasi adalah hari ini atau sebelumnya',
      path: ['isVaccinated'],
    },
  );

  static readonly UPDATE = this.dataModel.partial();

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
    vaccineId: z.coerce
      .number()
      .int()
      .positive()
      .or(z.literal(''))
      .transform((val) => (val === '' ? undefined : val))
      .optional(),
    isVaccinated: z
      .enum(['true', 'false'], {
        error: `Harus salah satu dari: true, false`,
      })
      .or(z.literal(''))
      .transform((val) => (val === '' ? undefined : val))
      .optional(),
    startDate: IndexValidation.OPTIONAL_DATE.optional(),
    endDate: IndexValidation.OPTIONAL_DATE.optional(),
  });
}

export type CreateVaccinationHistory = z.infer<
  typeof VaccinationHistoryValidation.CREATE
>;
export type UpdateVaccinationHistory = z.infer<
  typeof VaccinationHistoryValidation.UPDATE
>;
export type GetAllVaccinationHistory = z.infer<
  typeof VaccinationHistoryValidation.GET_ALL
>;
