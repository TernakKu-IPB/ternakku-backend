import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { FarmService } from '../../common/farm.service';
import { ModelPaginationService } from '../../common/model-pagination.service';
import { formatCreateAndUpdateAt } from '../../utils/date-formatter';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import type { VaccinationHistory } from './vaccination-history.model';
import type {
  CreateVaccinationHistory,
  UpdateVaccinationHistory,
  GetAllVaccinationHistory,
} from './vaccination-history.validation';
import { ApiPagination } from '../../types';
import { LivestockService } from '../../common/livestock.service';
import { Prisma } from '../../generated/prisma/client';

dayjs.extend(utc);

@Injectable()
export class VaccinationHistoryService {
  constructor(
    private prisma: PrismaService,
    private farm: FarmService,
    private modelPagination: ModelPaginationService,
    private livestock: LivestockService,
  ) {}

  private validateVaccinationLogic(
    isVaccinated: boolean,
    dateToCheck: string | Date,
  ) {
    if (isVaccinated) {
      const isFuture = dayjs.utc(dateToCheck).isAfter(dayjs.utc(), 'day');
      if (isFuture) {
        throw new UnprocessableEntityException(
          'Status sudah divaksin hanya berlaku jika tanggal vaksinasi adalah hari ini atau sebelumnya',
        );
      }
    }
  }

  async getAll(
    userId: number,
    data: GetAllVaccinationHistory,
  ): Promise<
    {
      vaccinationHistories: (VaccinationHistory & {
        vaccine: { id: number; name: string };
        livestock: { id: number; name: string | null; tagId: string | null };
      })[];
    } & ApiPagination
  > {
    const farmId = await this.farm.getFarmId(userId);
    const isVaccinated =
      data.isVaccinated === 'true'
        ? true
        : data.isVaccinated === 'false'
          ? false
          : undefined;

    const vaccinationHistories = await this.prisma.vaccinationHistory.findMany({
      where: {
        livestock: { farmId },
        ...(data.livestockId && { livestockId: data.livestockId }),
        ...(data.vaccineId && { vaccineId: data.vaccineId }),
        ...(isVaccinated !== undefined && { isVaccinated }),
        ...(data.startDate || data.endDate
          ? {
              vaccinationDate: {
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
        vaccine: {
          select: { id: true, name: true },
        },
        livestock: {
          select: { id: true, name: true, tagId: true },
        },
      },
      orderBy: { vaccinationDate: 'desc' },
      take: data.limit + 1,
      skip: data.offset,
    });

    const endpoint = '/vaccination-histories';
    const params = new URLSearchParams();
    if (data.livestockId)
      params.set('livestockId', data.livestockId.toString());
    if (data.vaccineId) params.set('vaccineId', data.vaccineId.toString());
    if (data.isVaccinated !== undefined)
      params.set('isVaccinated', data.isVaccinated);

    const { hasNextPage, paging } = this.modelPagination.getServerPageLink(
      data.offset,
      data.limit,
      vaccinationHistories.length,
      endpoint,
      params,
    );

    return {
      vaccinationHistories: (hasNextPage
        ? vaccinationHistories.slice(0, -1)
        : vaccinationHistories
      ).map((history) => ({
        ...history,
        vaccinationDate: dayjs
          .utc(history.vaccinationDate)
          .format('YYYY-MM-DD'),
        ...formatCreateAndUpdateAt(history.createdAt, history.updatedAt),
      })),
      paging,
    };
  }

  async getDetail(userId: number, id: number): Promise<VaccinationHistory> {
    const farmId = await this.farm.getFarmId(userId);
    const history = await this.prisma.vaccinationHistory.findUnique({
      where: { id, livestock: { farmId } },
      include: {
        livestock: {
          select: { farmId: true },
        },
      },
    });

    if (!history) {
      throw new NotFoundException('Riwayat vaksinasi tidak ditemukan');
    }

    return {
      ...history,
      vaccinationDate: dayjs.utc(history.vaccinationDate).format('YYYY-MM-DD'),
      ...formatCreateAndUpdateAt(history.createdAt, history.updatedAt),
    };
  }

  async create(
    userId: number,
    data: CreateVaccinationHistory,
  ): Promise<VaccinationHistory> {
    try {
      await this.livestock.checkAvailability(data.livestockId, userId);
      this.validateVaccinationLogic(data.isVaccinated, data.vaccinationDate);

      const history = await this.prisma.vaccinationHistory.create({
        data: {
          ...data,
          vaccinationDate: dayjs.utc(data.vaccinationDate).toISOString(),
        },
      });

      return {
        ...history,
        vaccinationDate: dayjs
          .utc(history.vaccinationDate)
          .format('YYYY-MM-DD'),
        ...formatCreateAndUpdateAt(history.createdAt, history.updatedAt),
      };
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2003'
      ) {
        throw new NotFoundException('Vaksin tidak ditemukan');
      }
      throw err;
    }
  }

  async update(
    userId: number,
    id: number,
    data: UpdateVaccinationHistory,
  ): Promise<VaccinationHistory> {
    try {
      const farmId = await this.farm.getFarmId(userId);

      const existing = await this.prisma.vaccinationHistory.findUnique({
        where: { id, livestock: { farmId } },
        select: {
          vaccineId: true,
          livestockId: true,
          isVaccinated: true,
          vaccinationDate: true,
          livestock: {
            select: { farmId: true },
          },
        },
      });

      if (!existing)
        throw new NotFoundException('Riwayat vaksinasi tidak ditemukan');

      if (data.livestockId && data.livestockId !== existing.livestockId) {
        await this.livestock.checkAvailability(data.livestockId, farmId);
      }

      const isVaccinated =
        data.isVaccinated !== undefined
          ? data.isVaccinated
          : existing.isVaccinated;
      const vaccinationDate =
        data.vaccinationDate !== undefined
          ? data.vaccinationDate
          : existing.vaccinationDate;
      this.validateVaccinationLogic(isVaccinated, vaccinationDate);

      const updated = await this.prisma.vaccinationHistory.update({
        where: { id },
        data: {
          ...data,
          ...(data.vaccinationDate && {
            vaccinationDate: dayjs.utc(data.vaccinationDate).toISOString(),
          }),
        },
      });

      return {
        ...updated,
        vaccinationDate: dayjs
          .utc(updated.vaccinationDate)
          .format('YYYY-MM-DD'),
        ...formatCreateAndUpdateAt(updated.createdAt, updated.updatedAt),
      };
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2003'
      ) {
        throw new NotFoundException('Vaksin tidak ditemukan');
      }
      throw err;
    }
  }

  async delete(userId: number, id: number): Promise<{ id: number }> {
    try {
      const farmId = await this.farm.getFarmId(userId);
      const deleted = await this.prisma.vaccinationHistory.delete({
        where: { id, livestock: { farmId } },
        select: { id: true },
      });
      return deleted;
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2025'
      ) {
        throw new NotFoundException('Riwayat vaksinasi tidak ditemukan');
      }
      throw err;
    }
  }
}
