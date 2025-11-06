import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GenericFhirController } from '../../fhir-generics/generic-fhir.controller';
import { PractitionerHistory } from './entities/practitioner-history.entity';
import { Practitioner } from './entities/practitioner.entity';
import { PractitionerService } from './practitioner.service';

/**
 * Practitioner Resource Controller
 * 
 * Provides FHIR-compliant Practitioner resource operations including:
 * - Standard CRUD operations (inherited from GenericFhirController)
 * - FHIR search operations
 * - RESTful endpoints for Practitioner resource management
 * 
 * All endpoints follow FHIR R4 specification for Practitioner resources.
 */
@ApiTags('Practitioner')
@Controller('Practitioner')
export class PractitionerController extends GenericFhirController<Practitioner, PractitionerHistory> {
    constructor(private readonly practitionerService: PractitionerService) {
        // Pass the injected service to the parent controller's constructor.
        super(practitionerService);
    }

    // Additional Practitioner-specific endpoints can be added here
    // For example:
    // - Get practitioners by specialty
    // - Get practitioners by organization
    // - Search practitioners by license number
    // etc.
}
