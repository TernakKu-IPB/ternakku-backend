import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { FarmService } from './farm.service';

@Injectable()
export class LivestockService {
  constructor(
    private prisma: PrismaService,
    private farm: FarmService,
  ) {}

  async checkAvailability(id: number, userId: number) {
    const farmId = await this.farm.getFarmId(userId);
    const livestock = await this.prisma.livestock.count({
      where: { id, farmId },
    });
    if (livestock === 0) {
      throw new NotFoundException(
        'Ternak tidak ditemukan dalam peternakan Anda',
      );
    }
  }
}
