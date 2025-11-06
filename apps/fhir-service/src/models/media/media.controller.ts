import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GenericFhirController } from '../../fhir-generics/generic-fhir.controller';
import { MediaHistory } from './entities/media-history.entity';
import { Media } from './entities/media.entity';
import { MediaService } from './media.service';

/**
 * Concrete controller for the Media resource.
 * 
 * It extends the GenericFhirController and requires no additional code
 * to get a full API surface for CRUD + Search operations.
 * The @ApiTags('Media') and @Controller('Media') decorator sets the base path for all routes
 * in this controller to `/Media`.
 */
@ApiTags('Media')
@Controller('Media')
export class MediaController extends GenericFhirController<Media, MediaHistory> {
    constructor(private readonly mediaService: MediaService) {
        // Pass the injected service to the parent controller's constructor.
        super(mediaService);
    }
}
