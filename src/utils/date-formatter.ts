import { Decimal } from '@prisma/client/runtime/client';
import dayjs from 'dayjs';

// export function dateToISOString(date?: Date | string | null): string | null {
//   return date ?  : null;
// }

// export function ISOStringToYYYMMDD(date?: Date | string | null): string | null {
//   return date ? dayjs.utc(date).format('YYYY-MM-DD') : null;
// }

export function formatCreateAndUpdateAt(
  createdAt?: Date | string,
  updatedAt?: Date | string,
): { createdAt: string; updatedAt: string } {
  return {
    createdAt: dayjs(createdAt).toISOString(),
    updatedAt: dayjs(updatedAt).toISOString(),
  };
}

export function formatLatitudeAndLongitude(
  latitude?: Decimal | null,
  longitude?: Decimal | null,
): { latitude: number | null; longitude: number | null } {
  return {
    latitude: latitude ? latitude.toNumber() : null,
    longitude: longitude ? longitude.toNumber() : null,
  };
}
