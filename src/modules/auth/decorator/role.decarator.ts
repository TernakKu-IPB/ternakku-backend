import { Reflector } from '@nestjs/core';
import { Role as PrismaRole } from '../../../generated/prisma/enums';

export const Role = Reflector.createDecorator<PrismaRole>();
