import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConventionBasedSearchService } from '../../core/search/convention-based-search.service';
import { GenericFhirService } from '../../fhir-generics/generic-fhir.service';
import { CoverageHistory } from './entities/coverage-history.entity';
import { Coverage } from './entities/coverage.entity';

@Injectable()
export class CoverageService extends GenericFhirService<Coverage, CoverageHistory> {
    protected readonly resourceType = 'Coverage';

    constructor(
        dataSource: DataSource,
        searchService: ConventionBasedSearchService
    ) {
        super(dataSource, searchService);
        this.currentRepo = dataSource.getRepository(Coverage);
        this.historyRepo = dataSource.getRepository(CoverageHistory);
    }
}
