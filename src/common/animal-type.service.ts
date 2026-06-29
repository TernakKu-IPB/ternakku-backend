import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class AnimalTypeService {
  constructor(private prisma: PrismaService) {}

  async checkAvailability(id: number, farmId: number): Promise<void> {
    const animalType = await this.prisma.animalType.count({
      where: { id, farmId },
    });
    if (animalType === 0)
      throw new NotFoundException(
        'Jenis hewan tidak ditemukan dalam peternakan Anda',
      );
  }
}
