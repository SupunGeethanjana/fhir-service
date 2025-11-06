import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreModule } from '../../core/core.module';
import { MedicationAdministrationHistory } from './entities/medication-administration-history.entity';
import { MedicationAdministration } from './entities/medication-administration.entity';
import { MedicationAdministrationController } from './medication-administration.controller';
import { MedicationAdministrationService } from './medication-administration.service';

@Module({
    imports: [TypeOrmModule.forFeature([MedicationAdministration, MedicationAdministrationHistory]), forwardRef(() => CoreModule)],
    controllers: [MedicationAdministrationController],
    providers: [MedicationAdministrationService],
    exports: [MedicationAdministrationService],
})
export class MedicationAdministrationModule { }
