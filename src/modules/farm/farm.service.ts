import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { UpsertFarm } from './farm.validation';
import type { Farm } from './farm.model';
import {
  formatCreateAndUpdateAt,
  formatLatitudeAndLongitude,
} from '../../utils/date-formatter';

@Injectable()
export class FarmService {
  constructor(private prisma: PrismaService) {}

  async getMyFarm(userId: number): Promise<Farm> {
    const farm = await this.prisma.farm.findUnique({
      where: { userId },
    });
    if (!farm) throw new NotFoundException('Anda belum memiliki peternakan');
    return {
      ...farm,
      ...formatLatitudeAndLongitude(farm.latitude, farm.longitude),
      ...formatCreateAndUpdateAt(farm.createdAt, farm.updatedAt),
    };
  }

  async upsertFarm(
    userId: number,
    data: UpsertFarm,
  ): Promise<Farm & { statusCode: HttpStatus }> {
    let farm = await this.prisma.farm.findUnique({
        where: { userId },
      }),
      statusCode = HttpStatus.OK;

    if (farm) {
      farm = await this.prisma.farm.update({
        where: { userId },
        data,
      });
    } else {
      statusCode = HttpStatus.CREATED;
      const { name, address } = data;
      if (!name || !address) {
        throw new BadRequestException(
          'Membuat peternakan baru membutuhkan nama dan alamat peternakan',
        );
      }
      farm = await this.prisma.farm.create({
        data: {
          ...data,
          name,
          address,
          userId: userId,
        },
      });
    }

    return {
      ...farm,
      ...formatLatitudeAndLongitude(farm.latitude, farm.longitude),
      ...formatCreateAndUpdateAt(farm.createdAt, farm.updatedAt),
      statusCode,
    };
  }
}
