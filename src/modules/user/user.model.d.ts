import { Gender } from '../../generated/prisma/enums';

export type User = {
  id: number;
  username: string;
  email: string;
  fullName: string;
  picture: string | null;
  birthDate: string | null;
  gender: Gender | null;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
};
