import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { FarmService } from './farm.service';
import { AuthGuard } from '../auth/guard/auth.guard';
import type { Request, Response } from 'express';
import { JwtPayload } from '../../types';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { FarmValidation } from './farm.validation';
import type { UpsertFarm } from './farm.validation';
import { ApiResponse } from '../../types';
import { VerifiedAccount } from '../auth/decorator/verified-account.decarator';
import { Farm } from './farm.model';

@Controller('farms')
@UseGuards(AuthGuard)
export class FarmController {
  constructor(private readonly service: FarmService) {}

  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getMyFarm(
    @Req() req: Request & { user: JwtPayload },
  ): Promise<ApiResponse<Farm>> {
    const farm = await this.service.getMyFarm(req.user.sub);
    return {
      message: 'Data peternakan berhasil diambil',
      data: farm,
      statusCode: HttpStatus.OK,
    };
  }

  @Patch('me')
  @VerifiedAccount()
  async upsertFarm(
    @Req() req: Request & { user: JwtPayload },
    @Body(new ZodValidationPipe(FarmValidation.UPSERT_FARM)) data: UpsertFarm,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<Farm>> {
    const { statusCode, ...farm } = await this.service.upsertFarm(
      req.user.sub,
      data,
    );
    res.status(statusCode);
    return {
      message:
        statusCode === HttpStatus.OK
          ? 'Profil peternakan berhasil diperbarui'
          : 'Peternakan berhasil dibuat',
      data: farm,
      statusCode: statusCode,
    };
  }
}
