import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class LivestockService {
  constructor(private prisma: PrismaService) {}

  async checkAvailability(id: number, farmId: number) {
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
