import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GenericFhirController } from '../../fhir-generics/generic-fhir.controller';
import { MedicationRequestService } from './medication-request.service';
import { MedicationRequest } from './entities/medication-request.entity';
import { MedicationRequestHistory } from './entities/medication-request-history.entity';

/**
 * Concrete controller for the MedicationRequest resource.
 * 
 * It extends the GenericFhirController and requires no additional code
 * to get a full API surface for CRUD + Search operations.
 * The @ApiTags('MedicationRequest')
@Controller('MedicationRequest') decorator sets the base path for all routes
 * in this controller to `/MedicationRequest`.
 */
@ApiTags('MedicationRequest')
@Controller('MedicationRequest')
export class MedicationRequestController extends GenericFhirController<MedicationRequest, MedicationRequestHistory> {
  constructor(private readonly medicationRequestService: MedicationRequestService) {
    // Pass the injected service to the parent controller's constructor.
    super(medicationRequestService);
  }
}
