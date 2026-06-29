import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import type { Vaccine } from './vaccine.model';
import { formatCreateAndUpdateAt } from '../../utils/date-formatter';
import {
  CreateVaccine,
  GetAllVaccine,
  UpdateVaccine,
} from './vaccine.validation';
import { Prisma } from '../../generated/prisma/client';
import { ModelPaginationService } from '../../common/model-pagination.service';
import { ApiPagination } from '../../types';

@Injectable()
export class VaccineService {
  constructor(
    private prisma: PrismaService,
    private modelPagination: ModelPaginationService,
  ) {}

  private async getFarmId(userId: number): Promise<number> {
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

  async getAll(
    userId: number,
    data: GetAllVaccine,
  ): Promise<{ vaccines: Vaccine[] } & ApiPagination> {
    const farmId = await this.getFarmId(userId);
    const vaccines = await this.prisma.vaccine.findMany({
      where: {
        farmId,
        ...(data.q && {
          OR: [{ code: { contains: data.q } }, { name: { contains: data.q } }],
        }),
      },
      orderBy: { name: 'asc' },
      take: data.limit + 1,
      skip: data.offset,
    });

    const endpoint = '/vaccines';
    const params = new URLSearchParams();
    if (data.q) params.set('q', data.q);
    const { hasNextPage, paging } = this.modelPagination.getServerPageLink(
      data.offset,
      data.limit,
      vaccines.length,
      endpoint,
      params,
    );

    return {
      vaccines: (hasNextPage ? vaccines.slice(0, -1) : vaccines).map(
        (vaccine) => ({
          ...vaccine,
          ...formatCreateAndUpdateAt(vaccine.createdAt, vaccine.updatedAt),
        }),
      ),
      paging,
    };
  }

  async checkCode(
    userId: number,
    code: string,
  ): Promise<{ isAvailable: boolean }> {
    const farmId = await this.getFarmId(userId);
    const existing = await this.prisma.vaccine.count({
      where: { farmId, code },
    });

    return { isAvailable: existing === 0 };
  }

  async create(userId: number, data: CreateVaccine): Promise<Vaccine> {
    const farmId = await this.getFarmId(userId);
    try {
      const vaccine = await this.prisma.vaccine.create({
        data: {
          ...data,
          farmId,
        },
      });
      return {
        ...vaccine,
        ...formatCreateAndUpdateAt(vaccine.createdAt, vaccine.updatedAt),
      };
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException(
          `Kode ${data.code} sudah ada. Silakan gunakan kode lain.`,
        );
      }
      throw err;
    }
  }

  async update(
    userId: number,
    id: number,
    data: UpdateVaccine,
  ): Promise<Vaccine> {
    const farmId = await this.getFarmId(userId);
    const existing = await this.prisma.vaccine.findUnique({ where: { id } });

    if (!existing) throw new NotFoundException('Vaksin tidak ditemukan');
    if (existing.farmId !== farmId) {
      throw new ForbiddenException(
        'Anda hanya dapat mengubah vaksin dalam peternakan Anda sendiri',
      );
    }

    try {
      const updated = await this.prisma.vaccine.update({
        where: { id },
        data,
      });

      return {
        ...updated,
        ...formatCreateAndUpdateAt(updated.createdAt, updated.updatedAt),
      };
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException(
          `Kode ${data.code} sudah ada. Silakan gunakan kode lain.`,
        );
      }
      throw err;
    }
  }

  async delete(userId: number, id: number): Promise<{ id: number }> {
    const farmId = await this.getFarmId(userId);
    const existing = await this.prisma.vaccine.findUnique({ where: { id } });

    if (!existing) throw new NotFoundException('Data tidak ditemukan');
    if (existing.farmId !== farmId) {
      throw new ForbiddenException(
        'Anda hanya dapat menghapus vaksin dalam peternakan Anda sendiri',
      );
    }

    const deleted = await this.prisma.vaccine.delete({
      where: { id },
      select: { id: true },
    });
    return deleted;
  }
}
