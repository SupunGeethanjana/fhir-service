import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GenericFhirController } from '../../fhir-generics/generic-fhir.controller';
import { PractitionerRoleHistory } from './entities/practitioner-role-history.entity';
import { PractitionerRole } from './entities/practitioner-role.entity';
import { PractitionerRoleService } from './practitioner-role.service';

/**
 * PractitionerRole Resource Controller
 * 
 * Provides FHIR-compliant PractitionerRole resource operations including:
 * - Standard CRUD operations (inherited from GenericFhirController)
 * - FHIR search operations
 * - PractitionerRole-specific endpoints
 * 
 * All endpoints follow FHIR R4 specification for PractitionerRole resources.
 * 
 * The PractitionerRole resource describes a specific role/location/specialty 
 * for a practitioner within an organization.
 */
@ApiTags('PractitionerRole')
@Controller('PractitionerRole')
export class PractitionerRoleController extends GenericFhirController<PractitionerRole, PractitionerRoleHistory> {
    constructor(private readonly practitionerRoleService: PractitionerRoleService) {
        // Pass the injected service to the parent controller's constructor.
        super(practitionerRoleService);
    }

    // Additional PractitionerRole-specific endpoints can be added here
    // Example:
    // @Get('by-practitioner/:practitionerId')
    // async getByPractitioner(@Param('practitionerId') practitionerId: string) {
    //   return this.practitionerRoleService.findByPractitioner(practitionerId);
    // }
    //
    // @Get('by-organization/:organizationId')
    // async getByOrganization(@Param('organizationId') organizationId: string) {
    //   return this.practitionerRoleService.findByOrganization(organizationId);
    // }
}
