import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { FarmService } from '../../common/farm.service';
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
import { ConditionTypeService } from '../../common/condition-type.service';

dayjs.extend(utc);

@Injectable()
export class ConditionHistoryService {
  constructor(
    private prisma: PrismaService,
    private farm: FarmService,
    private modelPagination: ModelPaginationService,
    private livestock: LivestockService,
    private condition: ConditionTypeService,
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
      where: { id },
      include: {
        livestock: {
          select: { farmId: true },
        },
      },
    });

    if (!history)
      throw new NotFoundException('Riwayat kondisi ternak tidak ditemukan');
    if (history.livestock.farmId !== farmId) {
      throw new ForbiddenException(
        'Anda hanya dapat melihat kondisi ternak dalam peternakan Anda sendiri',
      );
    }

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
    const farmId = await this.farm.getFarmId(userId);

    await this.livestock.checkAvailability(data.livestockId, farmId);
    await this.condition.checkAvailability(data.conditionTypeId, farmId);

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
  }

  async update(
    userId: number,
    id: number,
    data: UpdateConditionHistory,
  ): Promise<ConditionHistory> {
    const farmId = await this.farm.getFarmId(userId);

    const existing = await this.prisma.conditionHistory.findUnique({
      where: { id },
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
    if (existing.livestock.farmId !== farmId) {
      throw new ForbiddenException(
        'Anda hanya dapat mengubah kondisi ternak dalam peternakan Anda sendiri',
      );
    }

    if (data.livestockId && data.livestockId !== existing.livestockId) {
      await this.livestock.checkAvailability(data.livestockId, farmId);
    }

    if (
      data.conditionTypeId &&
      data.conditionTypeId !== existing.conditionTypeId
    ) {
      await this.condition.checkAvailability(data.conditionTypeId, farmId);
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
  }

  async delete(userId: number, id: number): Promise<{ id: number }> {
    const farmId = await this.farm.getFarmId(userId);
    const existing = await this.prisma.conditionHistory.findUnique({
      where: { id },
      select: {
        livestock: {
          select: { farmId: true },
        },
      },
    });

    if (!existing)
      throw new NotFoundException('Riwayat kondisi ternak tidak ditemukan');
    if (existing.livestock.farmId !== farmId) {
      throw new ForbiddenException(
        'Anda hanya dapat menghapus kondisi ternak dalam peternakan Anda sendiri',
      );
    }

    const deleted = await this.prisma.conditionHistory.delete({
      where: { id },
      select: { id: true },
    });
    return deleted;
  }
}
