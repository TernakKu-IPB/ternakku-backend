import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { UpdateUserProfile } from './user.validation';
import { User } from './user.model';
import { formatCreateAndUpdateAt } from '../../utils/date-formatter';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: number): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        picture: true,
        birthDate: true,
        gender: true,
        isVerified: true,
        updatedAt: true,
        createdAt: true,
      },
    });

    if (!user) throw new NotFoundException('Pengguna tidak ditemukan');
    return {
      ...user,
      birthDate: user.birthDate
        ? dayjs.utc(user.birthDate).format('YYYY-MM-DD')
        : null,
      ...formatCreateAndUpdateAt(user.createdAt, user.updatedAt),
    };
  }

  async updateProfile(userId: number, data: UpdateUserProfile): Promise<User> {
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        birthDate: data.birthDate
          ? dayjs.utc(data.birthDate).toISOString()
          : data.birthDate,
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        picture: true,
        birthDate: true,
        gender: true,
        isVerified: true,
        updatedAt: true,
        createdAt: true,
      },
    });

    return {
      ...updatedUser,
      birthDate: updatedUser.birthDate
        ? dayjs.utc(updatedUser.birthDate).format('YYYY-MM-DD')
        : null,
      ...formatCreateAndUpdateAt(updatedUser.createdAt, updatedUser.updatedAt),
    };
  }
}
