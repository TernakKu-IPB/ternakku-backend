import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class FarmService {
  constructor(private prisma: PrismaService) {}

  async getFarmId(userId: number): Promise<number> {
    const farm = await this.prisma.farm.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!farm) {
      throw new UnprocessableEntityException(
        'Anda harus membuat peternakan terlebih dahulu',
      );
    }
    return farm.id;
  }
}
