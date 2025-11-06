
import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GenericFhirController } from '../../fhir-generics/generic-fhir.controller';
import { CompositionService } from './composition.service';
import { Composition } from './entities/composition.entity';
import { CompositionHistory } from './entities/composition-history.entity';

/**
 * Concrete controller for the Composition resource.
 * 
 * It extends the GenericFhirController and requires no additional code
 * to get a full API surface for CRUD + Search operations.
 * The @ApiTags('Composition')
@Controller('Composition') decorator sets the base path for all routes
 * in this controller to `/Composition`.
 */
@ApiTags('Composition')
@Controller('Composition')
export class CompositionController extends GenericFhirController<Composition, CompositionHistory> {
  constructor(private readonly compositionService: CompositionService) {
    // Pass the injected service to the parent controller's constructor.
    super(compositionService);
  }
}