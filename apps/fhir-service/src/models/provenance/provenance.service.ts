import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConventionBasedSearchService } from '../../core/search/convention-based-search.service';
import { GenericFhirService } from '../../fhir-generics/generic-fhir.service';
import { ProvenanceHistory } from './entities/provenance-history.entity';
import { Provenance } from './entities/provenance.entity';

@Injectable()
export class ProvenanceService extends GenericFhirService<Provenance, ProvenanceHistory> {
    protected readonly resourceType = 'Provenance';

    constructor(
        dataSource: DataSource,
        searchService: ConventionBasedSearchService
    ) {
        super(dataSource, searchService);
        this.currentRepo = dataSource.getRepository(Provenance);
        this.historyRepo = dataSource.getRepository(ProvenanceHistory);
    }
}
