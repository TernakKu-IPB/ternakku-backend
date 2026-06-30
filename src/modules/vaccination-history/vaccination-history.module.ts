import { Module } from '@nestjs/common';
import { VaccinationHistoryService } from './vaccination-history.service';
import { VaccinationHistoryController } from './vaccination-history.controller';

@Module({
  providers: [VaccinationHistoryService],
  controllers: [VaccinationHistoryController],
})
export class VaccinationHistoryModule {}
