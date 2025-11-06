import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GenericFhirController } from '../../fhir-generics/generic-fhir.controller';
import { AllergyIntoleranceService } from './allergy-intolerance.service';
import { AllergyIntolerance } from './entities/allergy-intolerance.entity';
import { AllergyIntoleranceHistory } from './entities/allergy-intolerance-history.entity';

/**
 * Concrete controller for the AllergyIntolerance resource.
 * 
 * It extends the GenericFhirController and requires no additional code
 * to get a full API surface for CRUD + Search operations.
 * The @ApiTags('AllergyIntolerance')
@Controller('AllergyIntolerance') decorator sets the base path for all routes
 * in this controller to `/AllergyIntolerance`.
 */
@ApiTags('AllergyIntolerance')
@Controller('AllergyIntolerance')
export class AllergyIntoleranceController extends GenericFhirController<AllergyIntolerance, AllergyIntoleranceHistory> {
  constructor(private readonly allergyIntoleranceService: AllergyIntoleranceService) {
    // Pass the injected service to the parent controller's constructor.
    super(allergyIntoleranceService);
  }
}
