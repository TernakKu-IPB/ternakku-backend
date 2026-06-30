import {
  ForbiddenException,
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
import { VaccineService } from '../../common/vaccine.service';

dayjs.extend(utc);

@Injectable()
export class VaccinationHistoryService {
  constructor(
    private prisma: PrismaService,
    private farm: FarmService,
    private modelPagination: ModelPaginationService,
    private livestock: LivestockService,
    private vaccine: VaccineService,
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
  ): Promise<{ vaccinationHistories: VaccinationHistory[] } & ApiPagination> {
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
      where: { id },
      include: {
        livestock: {
          select: { farmId: true },
        },
      },
    });

    if (!history) {
      throw new NotFoundException('Riwayat vaksinasi tidak ditemukan');
    }
    if (history.livestock.farmId !== farmId) {
      throw new ForbiddenException(
        'Anda hanya dapat melihat vaksinasi ternak dalam peternakan Anda sendiri',
      );
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
    const farmId = await this.farm.getFarmId(userId);

    await this.livestock.checkAvailability(data.livestockId, farmId);
    await this.vaccine.checkAvailability(data.vaccineId, farmId);
    this.validateVaccinationLogic(data.isVaccinated, data.vaccinationDate);

    const history = await this.prisma.vaccinationHistory.create({
      data: {
        ...data,
        vaccinationDate: dayjs.utc(data.vaccinationDate).toISOString(),
      },
    });

    return {
      ...history,
      vaccinationDate: dayjs.utc(history.vaccinationDate).format('YYYY-MM-DD'),
      ...formatCreateAndUpdateAt(history.createdAt, history.updatedAt),
    };
  }

  async update(
    userId: number,
    id: number,
    data: UpdateVaccinationHistory,
  ): Promise<VaccinationHistory> {
    const farmId = await this.farm.getFarmId(userId);

    const existing = await this.prisma.vaccinationHistory.findUnique({
      where: { id },
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
    if (existing.livestock.farmId !== farmId) {
      throw new ForbiddenException(
        'Anda hanya dapat mengubah vaksinasi ternak dalam peternakan Anda sendiri',
      );
    }

    if (data.livestockId && data.livestockId !== existing.livestockId) {
      await this.livestock.checkAvailability(data.livestockId, farmId);
    }

    if (data.vaccineId && data.vaccineId !== existing.vaccineId) {
      await this.vaccine.checkAvailability(data.vaccineId, farmId);
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
      vaccinationDate: dayjs.utc(updated.vaccinationDate).format('YYYY-MM-DD'),
      ...formatCreateAndUpdateAt(updated.createdAt, updated.updatedAt),
    };
  }

  async delete(userId: number, id: number): Promise<{ id: number }> {
    const farmId = await this.farm.getFarmId(userId);
    const existing = await this.prisma.vaccinationHistory.findUnique({
      where: { id },
      select: {
        livestock: {
          select: { farmId: true },
        },
      },
    });

    if (!existing)
      throw new NotFoundException('Riwayat vaksinasi tidak ditemukan');
    if (existing.livestock.farmId !== farmId) {
      throw new ForbiddenException(
        'Anda tidak berhak menghapus data milik peternakan lain',
      );
    }

    const deleted = await this.prisma.vaccinationHistory.delete({
      where: { id },
      select: { id: true },
    });
    return deleted;
  }
}
