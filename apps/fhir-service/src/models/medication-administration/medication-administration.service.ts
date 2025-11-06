import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConventionBasedSearchService } from '../../core/search/convention-based-search.service';
import { GenericFhirService } from '../../fhir-generics/generic-fhir.service';
import { MedicationAdministrationHistory } from './entities/medication-administration-history.entity';
import { MedicationAdministration } from './entities/medication-administration.entity';

@Injectable()
export class MedicationAdministrationService extends GenericFhirService<MedicationAdministration, MedicationAdministrationHistory> {
    protected readonly resourceType = 'MedicationAdministration';

    constructor(
        dataSource: DataSource,
        searchService: ConventionBasedSearchService
    ) {
        super(dataSource, searchService);
        this.currentRepo = dataSource.getRepository(MedicationAdministration);
        this.historyRepo = dataSource.getRepository(MedicationAdministrationHistory);
    }
}
