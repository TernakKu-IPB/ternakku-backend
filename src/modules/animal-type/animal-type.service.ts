import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import type { AnimalType } from './animal-type.model';
import { formatCreateAndUpdateAt } from '../../utils/date-formatter';
import {
  CreateAnimalType,
  GetAllAnimalType,
  UpdateAnimalType,
} from './animal-type.validation';
import { Prisma } from '../../generated/prisma/client';
import { ModelPaginationService } from '../../common/model-pagination.service';
import { ApiPagination } from '../../types';

@Injectable()
export class AnimalTypeService {
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
    data: GetAllAnimalType,
  ): Promise<{ animalTypes: AnimalType[] } & ApiPagination> {
    const farmId = await this.getFarmId(userId);
    const animalTypes = await this.prisma.animalType.findMany({
      where: {
        farmId,
        ...(data.q && {
          OR: [{ code: { contains: data.q } }, { label: { contains: data.q } }],
        }),
      },
      orderBy: { label: 'asc' },
      take: data.limit + 1,
      skip: data.offset,
    });

    const endpoint = '/animal-types';
    const params = new URLSearchParams();
    if (data.q) params.set('q', data.q);
    const { hasNextPage, paging } = this.modelPagination.getServerPageLink(
      data.offset,
      data.limit,
      animalTypes.length,
      endpoint,
      params,
    );

    return {
      animalTypes: (hasNextPage ? animalTypes.slice(0, -1) : animalTypes).map(
        (animalType) => ({
          ...animalType,
          ...formatCreateAndUpdateAt(
            animalType.createdAt,
            animalType.updatedAt,
          ),
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
    const existing = await this.prisma.animalType.count({
      where: { farmId, code },
    });

    return { isAvailable: existing === 0 };
  }

  async create(userId: number, data: CreateAnimalType): Promise<AnimalType> {
    const farmId = await this.getFarmId(userId);
    try {
      const animalType = await this.prisma.animalType.create({
        data: {
          ...data,
          farmId,
        },
      });
      return {
        ...animalType,
        ...formatCreateAndUpdateAt(animalType.createdAt, animalType.updatedAt),
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
    data: UpdateAnimalType,
  ): Promise<AnimalType> {
    const farmId = await this.getFarmId(userId);
    const existing = await this.prisma.animalType.findUnique({ where: { id } });

    if (!existing) throw new NotFoundException('Jenis hewan tidak ditemukan');
    if (existing.farmId !== farmId) {
      throw new ForbiddenException(
        'Anda hanya dapat mengubah jenis hewan dalam peternakan Anda sendiri',
      );
    }

    try {
      const updated = await this.prisma.animalType.update({
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
    const existing = await this.prisma.animalType.findUnique({ where: { id } });

    if (!existing) throw new NotFoundException('Data tidak ditemukan');
    if (existing.farmId !== farmId) {
      throw new ForbiddenException(
        'Anda hanya dapat menghapus jenis hewan dalam peternakan Anda sendiri',
      );
    }

    const deleted = await this.prisma.animalType.delete({
      where: { id },
      select: { id: true },
    });
    return deleted;
  }
}
