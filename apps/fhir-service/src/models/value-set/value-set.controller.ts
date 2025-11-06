import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GenericFhirController } from '../../fhir-generics/generic-fhir.controller';
import { ValueSetHistory } from './entities/value-set-history.entity';
import { ValueSet } from './entities/value-set.entity';
import { ValueSetService } from './value-set.service';

/**
 * Concrete controller for the ValueSet resource.
 * 
 * It extends the GenericFhirController and requires no additional code
 * to get a full API surface for CRUD + Search operations.
 * The @ApiTags('ValueSet') and @Controller('ValueSet') decorator sets the base path for all routes
 * in this controller to `/ValueSet`.
 * 
 * ValueSet resources define collections of coded values from one or more code systems.
 * This controller provides RESTful endpoints for:
 * - Creating new value sets
 * - Retrieving value sets by ID
 * - Updating existing value sets
 * - Searching value sets by various parameters
 * - Managing value set versions and history
 * - Value set expansion operations (future enhancement)
 */
@ApiTags('ValueSet')
@Controller('ValueSet')
export class ValueSetController extends GenericFhirController<ValueSet, ValueSetHistory> {
    constructor(private readonly valueSetService: ValueSetService) {
        // Pass the injected service to the parent controller's constructor.
        super(valueSetService);
    }
}
