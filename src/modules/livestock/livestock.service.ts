import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { FarmService } from '../../common/farm.service';
import { formatCreateAndUpdateAt } from '../../utils/date-formatter';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import type { Livestock } from './livestock.model';
import type {
  CreateLivestock,
  UpdateLivestock,
  GetAllLivestock,
} from './livestock.validation';
import { Gender } from '../../generated/prisma/enums';
import { ApiPagination } from '../../types';
import { ModelPaginationService } from '../../common/model-pagination.service';
import { AnimalTypeService } from '../../common/animal-type.service';

dayjs.extend(utc);

@Injectable()
export class LivestockService {
  constructor(
    private prisma: PrismaService,
    private farm: FarmService,
    private modelPagination: ModelPaginationService,
    private animalType: AnimalTypeService,
  ) {}

  private async validateParents(
    farmId: number,
    fatherId?: number | null,
    motherId?: number | null,
  ) {
    if (fatherId) {
      const father = await this.prisma.livestock.findUnique({
        where: { id: fatherId },
      });
      if (!father || father.farmId !== farmId) {
        throw new NotFoundException(
          'Pejantan tidak ditemukan di peternakan Anda',
        );
      }
      if (father.gender !== Gender.male) {
        throw new UnprocessableEntityException(
          'Ternak yang dipilih sebagai Pejantan harus berjenis kelamin jantan',
        );
      }
    }

    if (motherId) {
      const mother = await this.prisma.livestock.findUnique({
        where: { id: motherId },
      });
      if (!mother || mother.farmId !== farmId) {
        throw new NotFoundException('Induk tidak ditemukan di peternakan Anda');
      }
      if (mother.gender !== Gender.female) {
        throw new UnprocessableEntityException(
          'Ternak yang dipilih sebagai Induk harus berjenis kelamin betina',
        );
      }
    }
  }

  async getAll(
    userId: number,
    data: GetAllLivestock,
  ): Promise<{ livestocks: Livestock[] } & ApiPagination> {
    const farmId = await this.farm.getFarmId(userId);

    const livestocks = await this.prisma.livestock.findMany({
      where: {
        farmId,
        ...(data.status && { status: data.status }),
        ...(data.q && {
          OR: [{ tagId: { contains: data.q } }, { name: { contains: data.q } }],
        }),
      },
      orderBy: { createdAt: 'desc' },
      take: data.limit + 1,
      skip: data.offset,
    });

    const endpoint = '/livestocks';
    const params = new URLSearchParams();
    if (data.q) params.set('q', data.q);
    if (data.status) params.set('status', data.status);

    const { hasNextPage, paging } = this.modelPagination.getServerPageLink(
      data.offset,
      data.limit,
      livestocks.length,
      endpoint,
      params,
    );

    return {
      livestocks: (hasNextPage ? livestocks.slice(0, -1) : livestocks).map(
        (livestock) => ({
          ...livestock,
          birthDate: livestock.birthDate
            ? dayjs.utc(livestock.birthDate).format('YYYY-MM-DD')
            : null,
          ...formatCreateAndUpdateAt(livestock.createdAt, livestock.updatedAt),
        }),
      ),
      paging,
    };
  }

  async getDetail(userId: number, id: number): Promise<Livestock> {
    const farmId = await this.farm.getFarmId(userId);
    const livestock = await this.prisma.livestock.findUnique({ where: { id } });

    if (!livestock) throw new NotFoundException('Data ternak tidak ditemukan');
    if (livestock.farmId !== farmId) {
      throw new ForbiddenException(
        'Anda hanya dapat melihat data ternak dalam peternakan Anda sendiri',
      );
    }

    return {
      ...livestock,
      birthDate: livestock.birthDate
        ? dayjs.utc(livestock.birthDate).format('YYYY-MM-DD')
        : null,
      ...formatCreateAndUpdateAt(livestock.createdAt, livestock.updatedAt),
    };
  }

  async create(userId: number, data: CreateLivestock): Promise<Livestock> {
    const farmId = await this.farm.getFarmId(userId);
    await this.animalType.checkAvailability(data.animalTypeId, farmId);
    await this.validateParents(farmId, data.fatherId, data.motherId);

    const livestock = await this.prisma.livestock.create({
      data: {
        ...data,
        birthDate: data.birthDate
          ? dayjs.utc(data.birthDate).toISOString()
          : data.birthDate,
        farmId,
      },
    });

    return {
      ...livestock,
      birthDate: livestock.birthDate
        ? dayjs.utc(livestock.birthDate).format('YYYY-MM-DD')
        : null,
      ...formatCreateAndUpdateAt(livestock.createdAt, livestock.updatedAt),
    };
  }

  async update(
    userId: number,
    id: number,
    data: UpdateLivestock,
  ): Promise<Livestock> {
    const farmId = await this.farm.getFarmId(userId);
    const existing = await this.prisma.livestock.findUnique({
      where: { id },
      select: {
        farmId: true,
        animalTypeId: true,
        fatherId: true,
        motherId: true,
        gender: true,
      },
    });

    if (!existing) throw new NotFoundException('Data ternak tidak ditemukan');
    if (existing.farmId !== farmId) {
      throw new ForbiddenException(
        'Anda hanya dapat mengubah data ternak dalam peternakan Anda sendiri',
      );
    }

    if (data.animalTypeId && data.animalTypeId !== existing.animalTypeId) {
      await this.animalType.checkAvailability(data.animalTypeId, farmId);
    }

    if (data.fatherId === id || data.motherId === id) {
      throw new UnprocessableEntityException(
        'Ternak tidak bisa menjadi induk/pejantan bagi dirinya sendiri',
      );
    }

    await this.validateParents(
      farmId,
      data.fatherId !== undefined ? data.fatherId : existing.fatherId,
      data.motherId !== undefined ? data.motherId : existing.motherId,
    );

    if (data.gender && data.gender !== existing.gender) {
      if (data.gender === Gender.male) {
        const asMotherCount = await this.prisma.livestock.count({
          where: { motherId: id },
        });
        if (asMotherCount > 0) {
          throw new UnprocessableEntityException(
            'Tidak dapat mengubah jenis kelamin menjadi jantan karena ternak ini sudah tercatat sebagai induk dari ternak lain',
          );
        }
      } else if (data.gender === Gender.female) {
        const asFatherCount = await this.prisma.livestock.count({
          where: { fatherId: id },
        });
        if (asFatherCount > 0) {
          throw new UnprocessableEntityException(
            'Tidak dapat mengubah jenis kelamin menjadi betina karena ternak ini sudah tercatat sebagai pejantan dari ternak lain',
          );
        }
      }
    }

    const updated = await this.prisma.livestock.update({
      where: { id },
      data: {
        ...data,
        birthDate: data.birthDate
          ? dayjs.utc(data.birthDate).toISOString()
          : data.birthDate,
      },
    });

    return {
      ...updated,
      birthDate: updated.birthDate
        ? dayjs.utc(updated.birthDate).format('YYYY-MM-DD')
        : null,
      ...formatCreateAndUpdateAt(updated.createdAt, updated.updatedAt),
    };
  }

  async delete(userId: number, id: number): Promise<{ id: number }> {
    const farmId = await this.farm.getFarmId(userId);
    const existing = await this.prisma.livestock.findUnique({
      where: { id },
      select: { farmId: true },
    });

    if (!existing) throw new NotFoundException('Data ternak tidak ditemukan');
    if (existing.farmId !== farmId) {
      throw new ForbiddenException(
        'Anda hanya dapat menghapus data ternak dalam peternakan Anda sendiri',
      );
    }

    const deleted = await this.prisma.livestock.delete({
      where: { id },
      select: { id: true },
    });
    return deleted;
  }
}
