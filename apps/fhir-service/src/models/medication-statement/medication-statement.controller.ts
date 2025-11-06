import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GenericFhirController } from '../../fhir-generics/generic-fhir.controller';
import { MedicationStatementHistory } from './entities/medical-statement-history.entity';
import { MedicationStatement } from './entities/medical-statement.entity';
import { MedicationStatementService } from './medication-statement.service';

/**
 * Concrete controller for the MedicationStatement resource.
 * 
 * It extends the GenericFhirController and requires no additional code
 * to get a full API surface for CRUD + Search operations.
 * The @Controller('MedicationStatement') decorator sets the base path for all routes
 * in this controller to `/MedicationStatement`.
 */
@ApiTags('MedicationStatement')
@Controller('MedicationStatement')
export class MedicationStatementController extends GenericFhirController<MedicationStatement, MedicationStatementHistory> {
  constructor(private readonly medicationStatementService: MedicationStatementService) {
    // Pass the injected service to the parent controller's constructor.
    super(medicationStatementService);
  }
}