import {
  ConflictException,
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

  async getAll(
    data: GetAllAnimalType,
  ): Promise<{ animalTypes: AnimalType[] } & ApiPagination> {
    const animalTypes = await this.prisma.animalType.findMany({
      where: {
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

  async getDetail(id: number): Promise<AnimalType> {
    const animalType = await this.prisma.animalType.findUnique({
      where: { id },
    });

    if (!animalType) throw new NotFoundException('Jenis hewan tidak ditemukan');

    return {
      ...animalType,
      ...formatCreateAndUpdateAt(animalType.createdAt, animalType.updatedAt),
    };
  }

  async checkCode(code: string): Promise<{ isAvailable: boolean }> {
    const existing = await this.prisma.animalType.count({
      where: { code },
    });

    return { isAvailable: existing === 0 };
  }

  async create(data: CreateAnimalType): Promise<AnimalType> {
    try {
      const animalType = await this.prisma.animalType.create({ data });

      return {
        ...animalType,
        ...formatCreateAndUpdateAt(animalType.createdAt, animalType.updatedAt),
      };
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException(`Kode ${data.code} sudah digunakan`);
      }
      throw err;
    }
  }

  async update(id: number, data: UpdateAnimalType): Promise<AnimalType> {
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
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
          throw new ConflictException(`Kode ${data.code} sudah digunakan`);
        } else if (err.code === 'P2025') {
          throw new NotFoundException('Jenis hewan tidak ditemukan');
        }
      }
      throw err;
    }
  }

  async delete(id: number): Promise<{ id: number }> {
    try {
      const deleted = await this.prisma.animalType.delete({
        where: { id },
        select: { id: true },
      });
      return deleted;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2003') {
          throw new UnprocessableEntityException(
            'Tidak dapat menghapus jenis ternak yang sudah digunakan',
          );
        } else if (err.code === 'P2025') {
          throw new NotFoundException('Jenis hewan tidak ditemukan');
        }
      }
      throw err;
    }
  }
}
