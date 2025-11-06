import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EncounterController } from './encounter.controller';
import { EncounterService } from './encounter.service';
import { Encounter } from './entities/encounter.entity';
import { EncounterHistory } from './entities/encounter-history.entity';
import { CoreModule } from '../../core/core.module';

/** The NestJS module for the Encounter resource. */
@Module({
  imports: [TypeOrmModule.forFeature([Encounter, EncounterHistory]), forwardRef(() => CoreModule)],
  controllers: [EncounterController],
  providers: [EncounterService],
  exports: [EncounterService],
})
export class EncounterModule {}