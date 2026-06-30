import { Module } from '@nestjs/common';
import { AnimalTypeService } from './animal-type.service';
import { AnimalTypeController } from './animal-type.controller';
import { AdminAnimalTypeController } from './admin-animal-type.controller';

@Module({
  providers: [AnimalTypeService],
  controllers: [AnimalTypeController, AdminAnimalTypeController],
})
export class AnimalTypeModule {}
