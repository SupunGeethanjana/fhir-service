import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreModule } from '../../core/core.module';
import { MedicationHistory } from './entities/medication-history.entity';
import { Medication } from './entities/medication.entity';
import { MedicationController } from './medication.controller';
import { MedicationService } from './medication.service';

/** The NestJS module for the Medication resource. */
@Module({
    imports: [TypeOrmModule.forFeature([Medication, MedicationHistory]), forwardRef(() => CoreModule)],
    controllers: [MedicationController],
    providers: [MedicationService],
    exports: [MedicationService],
})
export class MedicationModule { }
