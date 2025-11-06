import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GenericFhirController } from '../../fhir-generics/generic-fhir.controller';
import { EncounterService } from './encounter.service';
import { EncounterHistory } from './entities/encounter-history.entity';
import { Encounter } from './entities/encounter.entity';

/**
 * Concrete controller for the Encounter resource.
 * 
 * It extends the GenericFhirController and requires no additional code
 * to get a full API surface for CRUD + Search operations.
 * The @ApiTags('Encounter')
@Controller('Encounter') decorator sets the base path for all routes
 * in this controller to `/Encounter`.
 */
@ApiTags('Encounter')
@Controller('Encounter')
export class EncounterController extends GenericFhirController<Encounter, EncounterHistory> {
  constructor(private readonly encounterService: EncounterService) {
    // Pass the injected service to the parent controller's constructor.
    super(encounterService);
  }
}