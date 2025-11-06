import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConventionBasedSearchService } from '../../core/search/convention-based-search.service';
import { GenericFhirService } from '../../fhir-generics/generic-fhir.service';
import { ClaimHistory } from './entities/claim-history.entity';
import { Claim } from './entities/claim.entity';

@Injectable()
export class ClaimService extends GenericFhirService<Claim, ClaimHistory> {
    protected readonly resourceType = 'Claim';

    constructor(
        dataSource: DataSource,
        searchService: ConventionBasedSearchService
    ) {
        super(dataSource, searchService);
        this.currentRepo = dataSource.getRepository(Claim);
        this.historyRepo = dataSource.getRepository(ClaimHistory);
    }
}
