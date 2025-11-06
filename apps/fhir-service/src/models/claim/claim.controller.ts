import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GenericFhirController } from '../../fhir-generics/generic-fhir.controller';
import { ClaimService } from './claim.service';
import { ClaimHistory } from './entities/claim-history.entity';
import { Claim } from './entities/claim.entity';

@ApiTags('Claim')
@Controller('Claim')
export class ClaimController extends GenericFhirController<Claim, ClaimHistory> {
    constructor(private readonly claimService: ClaimService) {
        super(claimService);
    }
}
