import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GenericFhirController } from '../../fhir-generics/generic-fhir.controller';
import { CodeSystemService } from './code-system.service';
import { CodeSystemHistory } from './entities/code-system-history.entity';
import { CodeSystem } from './entities/code-system.entity';

/**
 * Concrete controller for the CodeSystem resource.
 * 
 * It extends the GenericFhirController and requires no additional code
 * to get a full API surface for CRUD + Search operations.
 * The @ApiTags('CodeSystem') and @Controller('CodeSystem') decorator sets the base path for all routes
 * in this controller to `/CodeSystem`.
 * 
 * CodeSystem resources define sets of codes and their meanings for use in other FHIR resources.
 * This controller provides RESTful endpoints for:
 * - Creating new code systems
 * - Retrieving code systems by ID
 * - Updating existing code systems
 * - Searching code systems by various parameters
 * - Managing code system versions and history
 */
@ApiTags('CodeSystem')
@Controller('CodeSystem')
export class CodeSystemController extends GenericFhirController<CodeSystem, CodeSystemHistory> {
    constructor(private readonly codeSystemService: CodeSystemService) {
        // Pass the injected service to the parent controller's constructor.
        super(codeSystemService);
    }
}
