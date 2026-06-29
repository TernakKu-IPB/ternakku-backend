import { Gender, LivestockStatus } from '../../generated/prisma/enums';

export type Livestock = {
  id: number;
  farmId: number;
  tagId: string | null;
  name: string | null;
  picture: string | null;
  animalTypeId: number;
  gender: Gender;
  birthDate: string | null;
  status: LivestockStatus;
  fatherId: number | null;
  motherId: number | null;
  createdAt: string;
  updatedAt: string;
};
