import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GenericFhirController } from '../../fhir-generics/generic-fhir.controller';
import { LocationHistory } from './entities/location-history.entity';
import { Location } from './entities/location.entity';
import { LocationService } from './location.service';

/**
 * Concrete controller for the Location resource.
 * 
 * It extends the GenericFhirController and requires no additional code
 * to get a full API surface for CRUD + Search operations.
 * The @ApiTags('Location')
 * @Controller('Location') decorator sets the base path for all routes
 * in this controller to `/Location`.
 */
@ApiTags('Location')
@Controller('Location')
export class LocationController extends GenericFhirController<Location, LocationHistory> {
    constructor(private readonly locationService: LocationService) {
        // Pass the injected service to the parent controller's constructor.
        super(locationService);
    }
}
