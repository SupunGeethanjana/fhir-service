import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GenericFhirController } from '../../fhir-generics/generic-fhir.controller';
import { ProvenanceHistory } from './entities/provenance-history.entity';
import { Provenance } from './entities/provenance.entity';
import { ProvenanceService } from './provenance.service';

@ApiTags('Provenance')
@Controller('Provenance')
export class ProvenanceController extends GenericFhirController<Provenance, ProvenanceHistory> {
    constructor(private readonly provenanceService: ProvenanceService) {
        super(provenanceService);
    }
}
