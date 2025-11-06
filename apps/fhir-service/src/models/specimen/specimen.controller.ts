import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GenericFhirController } from '../../fhir-generics/generic-fhir.controller';
import { SpecimenHistory } from './entities/specimen-history.entity';
import { Specimen } from './entities/specimen.entity';
import { SpecimenService } from './specimen.service';

/**
 * Concrete controller for the Specimen resource.
 * 
 * It extends the GenericFhirController and requires no additional code
 * to get a full API surface for CRUD + Search operations.
 * The @ApiTags('Specimen') and @Controller('Specimen') decorator sets the base path for all routes
 * in this controller to `/Specimen`.
 */
@ApiTags('Specimen')
@Controller('Specimen')
export class SpecimenController extends GenericFhirController<Specimen, SpecimenHistory> {
    constructor(private readonly specimenService: SpecimenService) {
        // Pass the injected service to the parent controller's constructor.
        super(specimenService);
    }
}
