export type User = {
  id: number;
  updatedAt: string;
  createdAt: string;
  username: string;
  email: string;
  fullName: string;
  picture: string | null;
  birthDate: string | null;
  gender: string | null;
  isVerified: boolean;
};
