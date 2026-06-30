import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { CommonModule } from './common/common.module';
import { UserModule } from './modules/user/user.module';
import { FarmModule } from './modules/farm/farm.module';
import { AnimalTypeModule } from './modules/animal-type/animal-type.module';
import { ConditionTypeModule } from './modules/condition-type/condition-type.module';
import { VaccineModule } from './modules/vaccine/vaccine.module';
import { LivestockModule } from './modules/livestock/livestock.module';
import { ConditionHistoryModule } from './modules/condition-history/condition-history.module';
import { VaccinationHistoryModule } from './modules/vaccination-history/vaccination-history.module';

@Module({
  imports: [
    CommonModule,
    AuthModule,
    UserModule,
    FarmModule,
    AnimalTypeModule,
    ConditionTypeModule,
    VaccineModule,
    LivestockModule,
    ConditionHistoryModule,
    VaccinationHistoryModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
