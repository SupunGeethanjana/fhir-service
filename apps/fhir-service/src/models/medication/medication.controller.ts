import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GenericFhirController } from '../../fhir-generics/generic-fhir.controller';
import { MedicationHistory } from './entities/medication-history.entity';
import { Medication } from './entities/medication.entity';
import { MedicationService } from './medication.service';

/**
 * Concrete controller for the Medication resource.
 * 
 * It extends the GenericFhirController and requires no additional code
 * to get a full API surface for CRUD + Search operations.
 * The @ApiTags('Medication')
 * @Controller('Medication') decorator sets the base path for all routes
 * in this controller to `/Medication`.
 */
@ApiTags('Medication')
@Controller('Medication')
export class MedicationController extends GenericFhirController<Medication, MedicationHistory> {
    constructor(private readonly medicationService: MedicationService) {
        // Pass the injected service to the parent controller's constructor.
        super(medicationService);
    }
}
