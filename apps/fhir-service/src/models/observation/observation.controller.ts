import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GenericFhirController } from '../../fhir-generics/generic-fhir.controller';
import { ObservationHistory } from './entities/observation-history.entity';
import { Observation } from './entities/observation.entity';
import { ObservationService } from './observation.service';

/**
 * Concrete controller for the Observation resource.
 * 
 * It extends the GenericFhirController and requires no additional code
 * to get a full API surface for CRUD + Search operations.
 * The @Controller('Observation') decorator sets the base path for all routes
 * in this controller to `/Observation`.
 */
@ApiTags('Observation')
@Controller('Observation')
export class ObservationController extends GenericFhirController<Observation, ObservationHistory> {
  constructor(private readonly observationService: ObservationService) {
    // Pass the injected service to the parent controller's constructor.
    super(observationService);
  }
}