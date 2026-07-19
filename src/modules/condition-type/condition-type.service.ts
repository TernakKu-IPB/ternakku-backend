import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import type { ConditionType } from './condition-type.model';
import { formatCreateAndUpdateAt } from '../../utils/date-formatter';
import {
  CreateConditionType,
  GetAllConditionType,
  UpdateConditionType,
} from './condition-type.validation';
import { Prisma } from '../../generated/prisma/client';
import { ModelPaginationService } from '../../common/model-pagination.service';
import { ApiPagination } from '../../types';
import { FarmService } from '../../common/farm.service';

@Injectable()
export class ConditionTypeService {
  constructor(
    private prisma: PrismaService,
    private modelPagination: ModelPaginationService,
    private farm: FarmService,
  ) {}

  async getAll(
    userId: number,
    data: GetAllConditionType,
  ): Promise<{ conditionTypes: ConditionType[] } & ApiPagination> {
    const farmId = await this.farm.getFarmId(userId);
    const conditionTypes = await this.prisma.conditionType.findMany({
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

    const endpoint = '/condition-types';
    const params = new URLSearchParams();
    if (data.q) params.set('q', data.q);
    const { hasNextPage, paging } = this.modelPagination.getServerPageLink(
      data.offset,
      data.limit,
      conditionTypes.length,
      endpoint,
      params,
    );

    return {
      conditionTypes: (hasNextPage
        ? conditionTypes.slice(0, -1)
        : conditionTypes
      ).map((conditionType) => ({
        ...conditionType,
        ...formatCreateAndUpdateAt(
          conditionType.createdAt,
          conditionType.updatedAt,
        ),
      })),
      paging,
    };
  }

  async getDetail(userId: number, id: number): Promise<ConditionType> {
    const farmId = await this.farm.getFarmId(userId);
    const conditionType = await this.prisma.conditionType.findUnique({
      where: { id },
    });

    if (!conditionType)
      throw new NotFoundException('Jenis kondisi tidak ditemukan');
    if (conditionType.farmId !== farmId) {
      throw new ForbiddenException(
        'Anda hanya dapat melihat jenis kondisi dalam peternakan Anda sendiri',
      );
    }

    return {
      ...conditionType,
      ...formatCreateAndUpdateAt(
        conditionType.createdAt,
        conditionType.updatedAt,
      ),
    };
  }

  async checkCode(
    userId: number,
    code: string,
  ): Promise<{ isAvailable: boolean }> {
    const farmId = await this.farm.getFarmId(userId);
    const existing = await this.prisma.conditionType.count({
      where: { farmId, code },
    });

    return { isAvailable: existing === 0 };
  }

  async create(
    userId: number,
    data: CreateConditionType,
  ): Promise<ConditionType> {
    const farmId = await this.farm.getFarmId(userId);
    try {
      const conditionType = await this.prisma.conditionType.create({
        data: {
          ...data,
          farmId,
        },
      });
      return {
        ...conditionType,
        ...formatCreateAndUpdateAt(
          conditionType.createdAt,
          conditionType.updatedAt,
        ),
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
    data: UpdateConditionType,
  ): Promise<ConditionType> {
    const farmId = await this.farm.getFarmId(userId);
    const existing = await this.prisma.conditionType.findUnique({
      where: { id },
      select: { farmId: true },
    });

    if (!existing) throw new NotFoundException('Jenis kondisi tidak ditemukan');
    if (existing.farmId !== farmId) {
      throw new ForbiddenException(
        'Anda hanya dapat mengubah jenis kondisi dalam peternakan Anda sendiri',
      );
    }

    try {
      const updated = await this.prisma.conditionType.update({
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
      const existing = await this.prisma.conditionType.findUnique({
        where: { id },
        select: { farmId: true },
      });

      if (!existing) throw new NotFoundException('Data tidak ditemukan');
      if (existing.farmId !== farmId) {
        throw new ForbiddenException(
          'Anda hanya dapat menghapus jenis kondisi dalam peternakan Anda sendiri',
        );
      }

      const deleted = await this.prisma.conditionType.delete({
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
          'Tidak dapat menghapus jenis kondisi yang sudah digunakan',
        );
      }
      throw err;
    }
  }

  async getAllTemplates(
    data: GetAllConditionType,
  ): Promise<{ conditionTypes: ConditionType[] } & ApiPagination> {
    const conditionTypes = await this.prisma.conditionType.findMany({
      where: {
        farmId: null,
        ...(data.q && {
          OR: [{ code: { contains: data.q } }, { label: { contains: data.q } }],
        }),
      },
      orderBy: { label: 'asc' },
      take: data.limit + 1,
      skip: data.offset,
    });

    const endpoint = '/condition-types/templates';
    const params = new URLSearchParams();
    if (data.q) params.set('q', data.q);

    const { hasNextPage, paging } = this.modelPagination.getServerPageLink(
      data.offset,
      data.limit,
      conditionTypes.length,
      endpoint,
      params,
    );

    return {
      conditionTypes: (hasNextPage
        ? conditionTypes.slice(0, -1)
        : conditionTypes
      ).map((conditionType) => ({
        ...conditionType,
        ...formatCreateAndUpdateAt(
          conditionType.createdAt,
          conditionType.updatedAt,
        ),
      })),
      paging,
    };
  }

  async getTemplateDetail(id: number): Promise<ConditionType> {
    const conditionType = await this.prisma.conditionType.findUnique({
      where: { id },
    });

    if (!conditionType)
      throw new NotFoundException('Jenis kondisi tidak ditemukan');
    if (conditionType.farmId !== null) {
      throw new ForbiddenException('Anda hanya dapat melihat template sistem');
    }

    return {
      ...conditionType,
      ...formatCreateAndUpdateAt(
        conditionType.createdAt,
        conditionType.updatedAt,
      ),
    };
  }

  async checkTemplateCode(code: string): Promise<{ isAvailable: boolean }> {
    const existing = await this.prisma.conditionType.count({
      where: { farmId: null, code },
    });

    return { isAvailable: existing === 0 };
  }

  async createTemplate(data: CreateConditionType): Promise<ConditionType> {
    const isCodeAlreadyUse = await this.prisma.conditionType.count({
      where: { code: data.code, farmId: null },
    });
    if (isCodeAlreadyUse) {
      throw new ConflictException(
        `Kode ${data.code} sudah digunakan pada template sistem`,
      );
    }

    const conditionType = await this.prisma.conditionType.create({
      data: {
        ...data,
        farmId: null,
      },
    });

    return {
      ...conditionType,
      ...formatCreateAndUpdateAt(
        conditionType.createdAt,
        conditionType.updatedAt,
      ),
    };
  }

  async updateTemplate(
    id: number,
    data: UpdateConditionType,
  ): Promise<ConditionType> {
    const existing = await this.prisma.conditionType.findUnique({
      where: { id },
      select: { farmId: true, code: true },
    });

    if (!existing) throw new NotFoundException('Jenis kondisi tidak ditemukan');
    if (existing.farmId !== null) {
      throw new ForbiddenException('Anda hanya dapat mengubah template sistem');
    }

    if (data.code && data.code !== existing.code) {
      const isCodeAlreadyUse = await this.prisma.conditionType.count({
        where: { code: data.code, farmId: null },
      });
      if (isCodeAlreadyUse) {
        throw new ConflictException(
          `Kode ${data.code} sudah digunakan pada template sistem`,
        );
      }
    }

    const updated = await this.prisma.conditionType.update({
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
      const existing = await this.prisma.conditionType.findUnique({
        where: { id },
        select: { farmId: true },
      });

      if (!existing)
        throw new NotFoundException('Jenis kondisi tidak ditemukan');
      if (existing.farmId !== null) {
        throw new ForbiddenException(
          'Anda hanya dapat menghapus template sistem',
        );
      }

      const deleted = await this.prisma.conditionType.delete({
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
          'Tidak dapat menghapus jenis kondisi yang sudah digunakan',
        );
      }
      throw err;
    }
  }
}
