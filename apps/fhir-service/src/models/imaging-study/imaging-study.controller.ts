import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GenericFhirController } from '../../fhir-generics/generic-fhir.controller';
import { ImagingStudyHistory } from './entities/imaging-study-history.entity';
import { ImagingStudy } from './entities/imaging-study.entity';
import { ImagingStudyService } from './imaging-study.service';

/**
 * Concrete controller for the ImagingStudy resource.
 * 
 * It extends the GenericFhirController and requires no additional code
 * to get a full API surface for CRUD + Search operations.
 * The @ApiTags('ImagingStudy') and @Controller('ImagingStudy') decorator sets the base path for all routes
 * in this controller to `/ImagingStudy`.
 */
@ApiTags('ImagingStudy')
@Controller('ImagingStudy')
export class ImagingStudyController extends GenericFhirController<ImagingStudy, ImagingStudyHistory> {
    constructor(private readonly imagingStudyService: ImagingStudyService) {
        // Pass the injected service to the parent controller's constructor.
        super(imagingStudyService);
    }
}
