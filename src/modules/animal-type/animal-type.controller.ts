import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AnimalTypeService } from './animal-type.service';
import { AuthGuard } from '../auth/guard/auth.guard';
import { VerifiedAccount } from '../auth/decorator/verified-account.decarator';
import { Role } from '../auth/decorator/role.decarator'; // Sesuaikan path import Role Anda
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { AnimalTypeValidation } from './animal-type.validation';
import type {
  CheckCodeAnimalType,
  CreateAnimalType,
  GetAllAnimalType,
  UpdateAnimalType,
} from './animal-type.validation';
import { AnimalType } from './animal-type.model';
import { ApiPagination, ApiResponse } from '../../types';

@Controller('animal-types')
export class AnimalTypeController {
  constructor(private readonly service: AnimalTypeService) {}

  @Get('check-code')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @VerifiedAccount(true)
  @Role('admin')
  async checkCode(
    @Query(new ZodValidationPipe(AnimalTypeValidation.CHECK_CODE))
    query: CheckCodeAnimalType,
  ): Promise<ApiResponse<{ isAvailable: boolean }>> {
    const result = await this.service.checkCode(query.code);
    return {
      message: `Kode ${query.code} ${result.isAvailable ? 'belum' : 'sudah'} ada`,
      data: result,
      statusCode: HttpStatus.OK,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllTemplates(
    @Query(new ZodValidationPipe(AnimalTypeValidation.GET_ALL))
    query: GetAllAnimalType,
  ): Promise<ApiResponse<{ animalTypes: AnimalType[] } & ApiPagination>> {
    const result = await this.service.getAll(query);
    return {
      message: 'Template jenis hewan berhasil diambil',
      data: result,
      statusCode: HttpStatus.OK,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getDetail(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<AnimalType>> {
    const result = await this.service.getDetail(id);
    return {
      message: 'Detail template jenis hewan berhasil diambil',
      data: result,
      statusCode: HttpStatus.OK,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthGuard)
  @VerifiedAccount(true)
  @Role('admin')
  async create(
    @Body(new ZodValidationPipe(AnimalTypeValidation.CREATE))
    data: CreateAnimalType,
  ): Promise<ApiResponse<AnimalType>> {
    const result = await this.service.create(data);
    return {
      message: 'Template jenis hewan berhasil ditambahkan',
      data: result,
      statusCode: HttpStatus.CREATED,
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @VerifiedAccount(true)
  @Role('admin')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(AnimalTypeValidation.UPDATE))
    data: UpdateAnimalType,
  ): Promise<ApiResponse<AnimalType>> {
    const result = await this.service.update(id, data);
    return {
      message: 'Template jenis hewan berhasil diperbarui',
      data: result,
      statusCode: HttpStatus.OK,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @VerifiedAccount(true)
  @Role('admin')
  async delete(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<{ id: number }>> {
    const result = await this.service.delete(id);
    return {
      message: 'Template jenis hewan berhasil dihapus',
      data: result,
      statusCode: HttpStatus.OK,
    };
  }
}
