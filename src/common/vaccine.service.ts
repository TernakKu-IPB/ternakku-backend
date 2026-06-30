import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class VaccineService {
  constructor(private prisma: PrismaService) {}

  async checkAvailability(id: number, farmId: number): Promise<void> {
    const vaccine = await this.prisma.vaccine.count({
      where: { id, farmId },
    });
    if (vaccine === 0)
      throw new NotFoundException(
        'Jenis vaksin tidak ditemukan dalam peternakan Anda',
      );
  }
}
