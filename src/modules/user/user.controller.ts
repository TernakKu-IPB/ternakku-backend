import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '../auth/guard/auth.guard';
import { Request } from 'express';
import { JwtPayload } from '../../types';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { UserValidation } from './user.validation';
import type { UpdateUserProfile } from './user.validation';
import { ApiResponse } from '../../types';
import { User } from './user.model';

@Controller('users')
@UseGuards(AuthGuard)
export class UserController {
  constructor(private readonly service: UserService) {}

  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getProfile(
    @Req() req: Request & { user: JwtPayload },
  ): Promise<ApiResponse<User>> {
    const user = await this.service.getProfile(req.user.sub);
    return {
      message: 'Profil berhasil diambil',
      data: user,
      statusCode: HttpStatus.OK,
    };
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @Req() req: Request & { user: JwtPayload },
    @Body(new ZodValidationPipe(UserValidation.UPDATE_PROFILE))
    data: UpdateUserProfile,
  ): Promise<ApiResponse<User>> {
    const user = await this.service.updateProfile(req.user.sub, data);
    return {
      message: 'Profil berhasil diperbarui',
      data: user,
      statusCode: HttpStatus.OK,
    };
  }
}
