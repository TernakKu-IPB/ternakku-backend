import { Module } from '@nestjs/common';
import { ConditionTypeService } from './condition-type.service';
import { ConditionTypeController } from './condition-type.controller';
import { AdminConditionTypeController } from './admin-condition-type.controller';

@Module({
  providers: [ConditionTypeService],
  controllers: [ConditionTypeController, AdminConditionTypeController],
})
export class ConditionTypeModule {}
