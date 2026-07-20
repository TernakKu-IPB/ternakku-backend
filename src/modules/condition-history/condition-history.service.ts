import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { ModelPaginationService } from '../../common/model-pagination.service';
import { formatCreateAndUpdateAt } from '../../utils/date-formatter';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import type { ConditionHistory } from './condition-history.model';
import type {
  CreateConditionHistory,
  UpdateConditionHistory,
  GetAllConditionHistory,
} from './condition-history.validation';
import { ApiPagination } from '../../types';
import { LivestockService } from '../../common/livestock.service';
import { FarmService } from '../../common/farm.service';
import { Prisma } from '../../generated/prisma/client';

dayjs.extend(utc);

@Injectable()
export class ConditionHistoryService {
  constructor(
    private prisma: PrismaService,
    private farm: FarmService,
    private modelPagination: ModelPaginationService,
    private livestock: LivestockService,
  ) {}

  async getAll(
    userId: number,
    data: GetAllConditionHistory,
  ): Promise<
    {
      conditionHistories: (ConditionHistory & {
        livestock: { id: number; name: string | null; tagId: string | null };
        conditionType: { id: number; label: string };
      })[];
    } & ApiPagination
  > {
    const farmId = await this.farm.getFarmId(userId);

    const conditionHistories = await this.prisma.conditionHistory.findMany({
      where: {
        livestock: { farmId },
        ...(data.livestockId && { livestockId: data.livestockId }),
        ...(data.conditionTypeId && { conditionTypeId: data.conditionTypeId }),
        ...(data.startDate || data.endDate
          ? {
              recordDate: {
                ...(data.startDate && {
                  gte: dayjs(data.startDate).startOf('day').toDate(),
                }),
                ...(data.endDate && {
                  lte: dayjs(data.endDate).endOf('day').toDate(),
                }),
              },
            }
          : {}),
      },
      include: {
        livestock: {
          select: { id: true, name: true, tagId: true },
        },
        conditionType: {
          select: { id: true, label: true },
        },
      },
      orderBy: { recordDate: 'desc' },
      take: data.limit + 1,
      skip: data.offset,
    });

    const endpoint = '/condition-histories';
    const params = new URLSearchParams();
    if (data.livestockId)
      params.set('livestockId', data.livestockId.toString());
    if (data.conditionTypeId)
      params.set('conditionTypeId', data.conditionTypeId.toString());

    const { hasNextPage, paging } = this.modelPagination.getServerPageLink(
      data.offset,
      data.limit,
      conditionHistories.length,
      endpoint,
      params,
    );

    return {
      conditionHistories: (hasNextPage
        ? conditionHistories.slice(0, -1)
        : conditionHistories
      ).map((history) => ({
        ...history,
        recordDate: dayjs.utc(history.recordDate).format('YYYY-MM-DD'),
        ...formatCreateAndUpdateAt(history.createdAt, history.updatedAt),
      })),
      paging,
    };
  }

  async getDetail(userId: number, id: number): Promise<ConditionHistory> {
    const farmId = await this.farm.getFarmId(userId);
    const history = await this.prisma.conditionHistory.findUnique({
      where: { id, livestock: { farmId } },
    });

    if (!history)
      throw new NotFoundException('Riwayat kondisi ternak tidak ditemukan');

    return {
      ...history,
      recordDate: dayjs.utc(history.recordDate).format('YYYY-MM-DD'),
      ...formatCreateAndUpdateAt(history.createdAt, history.updatedAt),
    };
  }

  async create(
    userId: number,
    data: CreateConditionHistory,
  ): Promise<ConditionHistory> {
    try {
      await this.livestock.checkAvailability(data.livestockId, userId);

      const history = await this.prisma.conditionHistory.create({
        data: {
          ...data,
          recordDate: dayjs.utc(data.recordDate).toISOString(),
        },
      });

      return {
        ...history,
        recordDate: dayjs.utc(history.recordDate).format('YYYY-MM-DD'),
        ...formatCreateAndUpdateAt(history.createdAt, history.updatedAt),
      };
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2003'
      ) {
        throw new NotFoundException('Jenis kondisi tidak ditemukan');
      }
      throw err;
    }
  }

  async update(
    userId: number,
    id: number,
    data: UpdateConditionHistory,
  ): Promise<ConditionHistory> {
    try {
      const farmId = await this.farm.getFarmId(userId);

      const existing = await this.prisma.conditionHistory.findUnique({
        where: { id, livestock: { farmId } },
        select: {
          conditionTypeId: true,
          livestockId: true,
          livestock: {
            select: { farmId: true },
          },
        },
      });

      if (!existing)
        throw new NotFoundException('Riwayat kondisi ternak tidak ditemukan');

      if (data.livestockId && data.livestockId !== existing.livestockId) {
        await this.livestock.checkAvailability(data.livestockId, userId);
      }

      const updated = await this.prisma.conditionHistory.update({
        where: { id },
        data: {
          ...data,
          ...(data.recordDate && {
            recordDate: dayjs.utc(data.recordDate).toISOString(),
          }),
        },
      });

      return {
        ...updated,
        recordDate: dayjs.utc(updated.recordDate).format('YYYY-MM-DD'),
        ...formatCreateAndUpdateAt(updated.createdAt, updated.updatedAt),
      };
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2003'
      ) {
        throw new NotFoundException('Jenis kondisi tidak ditemukan');
      }
      throw err;
    }
  }

  async delete(userId: number, id: number): Promise<{ id: number }> {
    try {
      const farmId = await this.farm.getFarmId(userId);
      const deleted = await this.prisma.conditionHistory.delete({
        where: { id, livestock: { farmId } },
        select: { id: true },
      });
      return deleted;
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2025'
      ) {
        throw new NotFoundException('Riwayat kondisi ternak tidak ditemukan');
      }
      throw err;
    }
  }
}
