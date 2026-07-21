import {
  ConflictException,
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

@Injectable()
export class ConditionTypeService {
  constructor(
    private prisma: PrismaService,
    private modelPagination: ModelPaginationService,
  ) {}

  async getAll(
    data: GetAllConditionType,
  ): Promise<{ conditionTypes: ConditionType[] } & ApiPagination> {
    const conditionTypes = await this.prisma.conditionType.findMany({
      where: {
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

  async getDetail(id: number): Promise<ConditionType> {
    const conditionType = await this.prisma.conditionType.findUnique({
      where: { id },
    });

    if (!conditionType)
      throw new NotFoundException('Jenis kondisi tidak ditemukan');

    return {
      ...conditionType,
      ...formatCreateAndUpdateAt(
        conditionType.createdAt,
        conditionType.updatedAt,
      ),
    };
  }

  async checkCode(code: string): Promise<{ isAvailable: boolean }> {
    const existing = await this.prisma.conditionType.count({
      where: { code },
    });

    return { isAvailable: existing === 0 };
  }

  async create(data: CreateConditionType): Promise<ConditionType> {
    try {
      const conditionType = await this.prisma.conditionType.create({ data });

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
        throw new ConflictException(`Kode ${data.code} sudah digunakan`);
      }
      throw err;
    }
  }

  async update(id: number, data: UpdateConditionType): Promise<ConditionType> {
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
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
          throw new ConflictException(`Kode ${data.code} sudah digunakan`);
        } else if (err.code === 'P2025') {
          throw new NotFoundException('Jenis kondisi tidak ditemukan');
        }
      }
      throw err;
    }
  }

  async delete(id: number): Promise<{ id: number }> {
    try {
      const deleted = await this.prisma.conditionType.delete({
        where: { id },
        select: { id: true },
      });
      return deleted;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2003') {
          throw new UnprocessableEntityException(
            'Tidak dapat menghapus jenis kondisi yang sudah digunakan',
          );
        } else if (err.code === 'P2025') {
          throw new NotFoundException('Jenis kondisi tidak ditemukan');
        }
      }
      throw err;
    }
  }
}
