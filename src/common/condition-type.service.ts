import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class ConditionTypeService {
  constructor(private prisma: PrismaService) {}

  async checkAvailability(id: number, farmId: number): Promise<void> {
    const conditionType = await this.prisma.conditionType.count({
      where: { id, farmId },
    });
    if (conditionType === 0)
      throw new NotFoundException(
        'Jenis kondisi tidak ditemukan dalam peternakan Anda',
      );
  }
}
