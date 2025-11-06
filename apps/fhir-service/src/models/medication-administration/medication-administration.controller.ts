import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GenericFhirController } from '../../fhir-generics/generic-fhir.controller';
import { MedicationAdministrationHistory } from './entities/medication-administration-history.entity';
import { MedicationAdministration } from './entities/medication-administration.entity';
import { MedicationAdministrationService } from './medication-administration.service';

@ApiTags('MedicationAdministration')
@Controller('MedicationAdministration')
export class MedicationAdministrationController extends GenericFhirController<MedicationAdministration, MedicationAdministrationHistory> {
    constructor(private readonly medicationAdministrationService: MedicationAdministrationService) {
        super(medicationAdministrationService);
    }
}
