import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GenericFhirController } from '../../fhir-generics/generic-fhir.controller';
import { ImmunizationHistory } from './entities/immunization-history.entity';
import { Immunization } from './entities/immunization.entity';
import { ImmunizationService } from './immunization.service';

/**
 * Immunization Resource Controller
 * 
 * Provides FHIR-compliant Immunization resource operations including:
 * - Standard CRUD operations (inherited from GenericFhirController)
 * - FHIR search operations
 * - Immunization-specific endpoints
 * 
 * All endpoints follow FHIR R4 specification for Immunization resources.
 * 
 * The Immunization resource represents the event of a patient being administered 
 * a vaccine or a record of an immunization as reported by a patient, a clinician 
 * or another party.
 */
@ApiTags('Immunization')
@Controller('Immunization')
export class ImmunizationController extends GenericFhirController<Immunization, ImmunizationHistory> {
    constructor(private readonly immunizationService: ImmunizationService) {
        // Pass the injected service to the parent controller's constructor.
        super(immunizationService);
    }

    // Additional Immunization-specific endpoints can be added here
    // Example:
    // @Get('by-patient/:patientId')
    // async getByPatient(@Param('patientId') patientId: string) {
    //   return this.immunizationService.findByPatient(patientId);
    // }
}
