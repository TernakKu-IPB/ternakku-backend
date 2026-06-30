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
  Req,
  UseGuards,
} from '@nestjs/common';
import { AnimalTypeService } from './animal-type.service';
import { AuthGuard } from '../auth/guard/auth.guard';
import { VerifiedAccount } from '../auth/decorator/verified-account.decarator';
import type { Request } from 'express';
import { JwtPayload, ApiResponse, ApiPagination } from '../../types';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { AnimalTypeValidation } from './animal-type.validation';
import type {
  CheckCodeAnimalType,
  CreateAnimalType,
  GetAllAnimalType,
  UpdateAnimalType,
} from './animal-type.validation';
import { AnimalType } from './animal-type.model';

@Controller('animal-types')
@UseGuards(AuthGuard)
@VerifiedAccount()
export class AnimalTypeController {
  constructor(private readonly service: AnimalTypeService) {}

  @Get('templates')
  @HttpCode(HttpStatus.OK)
  async getAllTemplates(
    @Query(new ZodValidationPipe(AnimalTypeValidation.GET_ALL))
    query: GetAllAnimalType,
  ): Promise<ApiResponse<{ animalTypes: AnimalType[] } & ApiPagination>> {
    const result = await this.service.getAllTemplates(query);
    return {
      message: 'Template jenis hewan berhasil diambil',
      data: result,
      statusCode: HttpStatus.OK,
    };
  }

  @Get('check-code')
  @HttpCode(HttpStatus.OK)
  async checkCode(
    @Req() req: Request & { user: JwtPayload },
    @Query(new ZodValidationPipe(AnimalTypeValidation.CHECK_CODE))
    query: CheckCodeAnimalType,
  ): Promise<ApiResponse<{ isAvailable: boolean }>> {
    const result = await this.service.checkCode(req.user.sub, query.code);
    return {
      message: `Kode ${query.code} ${result.isAvailable ? 'belum' : 'sudah'} ada`,
      data: result,
      statusCode: HttpStatus.OK,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAll(
    @Req() req: Request & { user: JwtPayload },
    @Query(new ZodValidationPipe(AnimalTypeValidation.GET_ALL))
    query: GetAllAnimalType,
  ): Promise<ApiResponse<{ animalTypes: AnimalType[] } & ApiPagination>> {
    const data = await this.service.getAll(req.user.sub, query);
    return {
      message: 'Data jenis hewan berhasil diambil',
      data,
      statusCode: HttpStatus.OK,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getDetail(
    @Req() req: Request & { user: JwtPayload },
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<AnimalType>> {
    const result = await this.service.getDetail(req.user.sub, id);
    return {
      message: 'Detail jenis hewan berhasil diambil',
      data: result,
      statusCode: HttpStatus.OK,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: Request & { user: JwtPayload },
    @Body(new ZodValidationPipe(AnimalTypeValidation.CREATE))
    data: CreateAnimalType,
  ): Promise<ApiResponse<AnimalType>> {
    const result = await this.service.create(req.user.sub, data);
    return {
      message: 'Jenis hewan berhasil ditambahkan',
      data: result,
      statusCode: HttpStatus.CREATED,
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Req() req: Request & { user: JwtPayload },
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(AnimalTypeValidation.UPDATE))
    data: UpdateAnimalType,
  ): Promise<ApiResponse<AnimalType>> {
    const result = await this.service.update(req.user.sub, id, data);
    return {
      message: 'Jenis hewan berhasil diperbarui',
      data: result,
      statusCode: HttpStatus.OK,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Req() req: Request & { user: JwtPayload },
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<{ id: number }>> {
    const result = await this.service.delete(req.user.sub, id);
    return {
      message: 'Tipe hewan berhasil dihapus',
      data: result,
      statusCode: HttpStatus.OK,
    };
  }
}
