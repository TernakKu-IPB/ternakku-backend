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
import { FarmService } from '../../common/farm.service';

@Injectable()
export class VaccineService {
  constructor(
    private prisma: PrismaService,
    private modelPagination: ModelPaginationService,
    private farm: FarmService,
  ) {}

  async getAll(
    userId: number,
    data: GetAllVaccine,
  ): Promise<{ vaccines: Vaccine[] } & ApiPagination> {
    const farmId = await this.farm.getFarmId(userId);
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

  async getDetail(userId: number, id: number): Promise<Vaccine> {
    const farmId = await this.farm.getFarmId(userId);
    const vaccine = await this.prisma.vaccine.findUnique({ where: { id } });

    if (!vaccine) throw new NotFoundException('Vaksin tidak ditemukan');
    if (vaccine.farmId !== farmId) {
      throw new ForbiddenException(
        'Anda hanya dapat melihat vaksin dalam peternakan Anda sendiri',
      );
    }

    return {
      ...vaccine,
      ...formatCreateAndUpdateAt(vaccine.createdAt, vaccine.updatedAt),
    };
  }

  async checkCode(
    userId: number,
    code: string,
  ): Promise<{ isAvailable: boolean }> {
    const farmId = await this.farm.getFarmId(userId);
    const existing = await this.prisma.vaccine.count({
      where: { farmId, code },
    });

    return { isAvailable: existing === 0 };
  }

  async create(userId: number, data: CreateVaccine): Promise<Vaccine> {
    const farmId = await this.farm.getFarmId(userId);
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
          `Kode ${data.code} sudah ada. Silakan gunakan kode lain`,
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
    const farmId = await this.farm.getFarmId(userId);
    const existing = await this.prisma.vaccine.findUnique({
      where: { id },
      select: { farmId: true },
    });

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
          `Kode ${data.code} sudah ada. Silakan gunakan kode lain`,
        );
      }
      throw err;
    }
  }

  async delete(userId: number, id: number): Promise<{ id: number }> {
    try {
      const farmId = await this.farm.getFarmId(userId);
      const existing = await this.prisma.vaccine.findUnique({
        where: { id },
        select: { farmId: true },
      });

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
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2003'
      ) {
        throw new UnprocessableEntityException(
          'Tidak dapat menghapus jenis vaksin yang sudah digunakan',
        );
      }
      throw err;
    }
  }

  async getAllTemplates(
    data: GetAllVaccine,
  ): Promise<{ vaccines: Vaccine[] } & ApiPagination> {
    const vaccines = await this.prisma.vaccine.findMany({
      where: {
        farmId: null,
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

  async getTemplateDetail(id: number): Promise<Vaccine> {
    const vaccine = await this.prisma.vaccine.findUnique({
      where: { id },
    });

    if (!vaccine) throw new NotFoundException('Vaksin tidak ditemukan');
    if (vaccine.farmId !== null) {
      throw new ForbiddenException('Anda hanya dapat melihat template sistem');
    }

    return {
      ...vaccine,
      ...formatCreateAndUpdateAt(vaccine.createdAt, vaccine.updatedAt),
    };
  }

  async checkTemplateCode(code: string): Promise<{ isAvailable: boolean }> {
    const existing = await this.prisma.vaccine.count({
      where: { farmId: null, code },
    });

    return { isAvailable: existing === 0 };
  }

  async createTemplate(data: CreateVaccine): Promise<Vaccine> {
    const isCodeAlreadyUse = await this.prisma.vaccine.count({
      where: { code: data.code, farmId: null },
    });
    if (isCodeAlreadyUse) {
      throw new ConflictException(
        `Kode ${data.code} sudah digunakan pada template sistem`,
      );
    }

    const vaccine = await this.prisma.vaccine.create({
      data: {
        ...data,
        farmId: null,
      },
    });

    return {
      ...vaccine,
      ...formatCreateAndUpdateAt(vaccine.createdAt, vaccine.updatedAt),
    };
  }

  async updateTemplate(id: number, data: UpdateVaccine): Promise<Vaccine> {
    const existing = await this.prisma.vaccine.findUnique({
      where: { id },
      select: { farmId: true, code: true },
    });

    if (!existing) throw new NotFoundException('Vaksin tidak ditemukan');
    if (existing.farmId !== null) {
      throw new ForbiddenException('Anda hanya dapat mengubah template sistem');
    }

    if (data.code && data.code !== existing.code) {
      const isCodeAlreadyUse = await this.prisma.vaccine.count({
        where: { code: data.code, farmId: null },
      });
      if (isCodeAlreadyUse) {
        throw new ConflictException(
          `Kode ${data.code} sudah digunakan pada template sistem`,
        );
      }
    }

    const updated = await this.prisma.vaccine.update({
      where: { id },
      data,
    });

    return {
      ...updated,
      ...formatCreateAndUpdateAt(updated.createdAt, updated.updatedAt),
    };
  }

  async deleteTemplate(id: number): Promise<{ id: number }> {
    try {
      const existing = await this.prisma.vaccine.findUnique({
        where: { id },
        select: { farmId: true },
      });

      if (!existing) throw new NotFoundException('Vaksin tidak ditemukan');
      if (existing.farmId !== null) {
        throw new ForbiddenException(
          'Anda hanya dapat menghapus template sistem',
        );
      }

      const deleted = await this.prisma.vaccine.delete({
        where: { id },
        select: { id: true },
      });
      return deleted;
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2003'
      ) {
        throw new UnprocessableEntityException(
          'Tidak dapat menghapus jenis vaksin yang sudah digunakan',
        );
      }
      throw err;
    }
  }
}
