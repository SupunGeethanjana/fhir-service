import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GenericFhirController } from '../../fhir-generics/generic-fhir.controller';
import { ConditionService } from './condition.service';
import { Condition } from './entities/condition.entity';
import { ConditionHistory } from './entities/condition-history.entity';

/**
 * Concrete controller for the Condition resource.
 * 
 * It extends the GenericFhirController and requires no additional code
 * to get a full API surface for CRUD + Search operations.
 * The @ApiTags('Condition')
@Controller('Condition') decorator sets the base path for all routes
 * in this controller to `/Condition`.
 */
@ApiTags('Condition')
@Controller('Condition')
export class ConditionController extends GenericFhirController<Condition, ConditionHistory> {
  constructor(private readonly conditionService: ConditionService) {
    // Pass the injected service to the parent controller's constructor.
    super(conditionService);
  }
}