import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GenericFhirController } from '../../fhir-generics/generic-fhir.controller';
import { CoverageService } from './coverage.service';
import { CoverageHistory } from './entities/coverage-history.entity';
import { Coverage } from './entities/coverage.entity';

@ApiTags('Coverage')
@Controller('Coverage')
export class CoverageController extends GenericFhirController<Coverage, CoverageHistory> {
    constructor(private readonly coverageService: CoverageService) {
        super(coverageService);
    }
}
