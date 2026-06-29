import { z } from 'zod';

export class FarmValidation {
  static readonly UPSERT_FARM = z.object({
    name: z
      .string()
      .min(3, 'Minimal 3 karakter')
      .max(100, 'Maksimal 100 karakter')
      .optional(),
    address: z.string().min(3, 'Minimal 3 karakter').optional(),
    latitude: z
      .number()
      .min(-90, 'Lokasi tidak valid')
      .max(90, 'Lokasi tidak valid')
      .nullable()
      .optional(),
    longitude: z
      .number()
      .min(-180, 'Lokasi tidak valid')
      .max(180, 'Lokasi tidak valid')
      .nullable()
      .optional(),
    description: z
      .string()
      .transform((value) => (value === '' ? null : value))
      .nullable()
      .optional(),
  });
}

export type UpsertFarm = z.infer<typeof FarmValidation.UPSERT_FARM>;
