import { Module } from '@nestjs/common';
import { VaccineService } from './vaccine.service';
import { VaccineController } from './vaccine.controller';
import { AdminVaccineController } from './admin-vaccine.controller';

@Module({
  providers: [VaccineService],
  controllers: [VaccineController, AdminVaccineController],
})
export class VaccineModule {}
