import {
  ConflictException,
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

  async getAll(
    data: GetAllVaccine,
  ): Promise<{ vaccines: Vaccine[] } & ApiPagination> {
    const vaccines = await this.prisma.vaccine.findMany({
      where: {
        ...(data.q && {
          OR: [{ code: { contains: data.q } }, { name: { contains: data.q } }],
        }),
      },
      orderBy: { name: 'asc' },
      take: data.limit + 1,
      skip: data.offset,
    });

    const endpoint = '/vaccines/templates';
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

  async getDetail(id: number): Promise<Vaccine> {
    const vaccine = await this.prisma.vaccine.findUnique({
      where: { id },
    });

    if (!vaccine) throw new NotFoundException('Vaksin tidak ditemukan');

    return {
      ...vaccine,
      ...formatCreateAndUpdateAt(vaccine.createdAt, vaccine.updatedAt),
    };
  }

  async checkCode(code: string): Promise<{ isAvailable: boolean }> {
    const existing = await this.prisma.vaccine.count({
      where: { code },
    });

    return { isAvailable: existing === 0 };
  }

  async create(data: CreateVaccine): Promise<Vaccine> {
    try {
      const vaccine = await this.prisma.vaccine.create({ data });

      return {
        ...vaccine,
        ...formatCreateAndUpdateAt(vaccine.createdAt, vaccine.updatedAt),
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

  async update(id: number, data: UpdateVaccine): Promise<Vaccine> {
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
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
          throw new ConflictException(`Kode ${data.code} sudah digunakan`);
        } else if (err.code === 'P2025') {
          throw new NotFoundException('Vaksin tidak ditemukan');
        }
      }
      throw err;
    }
  }

  async delete(id: number): Promise<{ id: number }> {
    try {
      const deleted = await this.prisma.vaccine.delete({
        where: { id },
        select: { id: true },
      });
      return deleted;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2003') {
          throw new UnprocessableEntityException(
            'Tidak dapat menghapus vaksin yang sudah digunakan',
          );
        } else if (err.code === 'P2025') {
          throw new NotFoundException('Vaksin tidak ditemukan');
        }
      }
      throw err;
    }
  }
}
