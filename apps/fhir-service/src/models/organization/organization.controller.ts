import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GenericFhirController } from '../../fhir-generics/generic-fhir.controller';
import { OrganizationHistory } from './entities/organization-history.entity';
import { Organization } from './entities/organization.entity';
import { OrganizationService } from './organization.service';

/**
 * Concrete controller for the Organization resource.
 * 
 * It extends the GenericFhirController and requires no additional code
 * to get a full API surface for CRUD + Search operations.
 * The @ApiTags('Organization')
 * @Controller('Organization') decorator sets the base path for all routes
 * in this controller to `/Organization`.
 */
@ApiTags('Organization')
@Controller('Organization')
export class OrganizationController extends GenericFhirController<Organization, OrganizationHistory> {
    constructor(private readonly organizationService: OrganizationService) {
        // Pass the injected service to the parent controller's constructor.
        super(organizationService);
    }
}
