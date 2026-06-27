import { Reflector } from '@nestjs/core';

export const VerifiedAccount = Reflector.createDecorator<boolean>();
