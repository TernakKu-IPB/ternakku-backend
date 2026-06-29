import { Module } from '@nestjs/common';
import { VaccineService } from './vaccine.service';
import { VaccineController } from './vaccine.controller';

@Module({
  providers: [VaccineService],
  controllers: [VaccineController],
})
export class VaccineModule {}
