import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConventionBasedSearchService } from '../../core/search/convention-based-search.service';
import { GenericFhirService } from '../../fhir-generics/generic-fhir.service';
import { DocumentReferenceHistory } from './entities/document-reference-history.entity';
import { DocumentReference } from './entities/document-reference.entity';

@Injectable()
export class DocumentReferenceService extends GenericFhirService<DocumentReference, DocumentReferenceHistory> {
    protected readonly resourceType = 'DocumentReference';

    constructor(
        dataSource: DataSource,
        searchService: ConventionBasedSearchService
    ) {
        super(dataSource, searchService);
        this.currentRepo = dataSource.getRepository(DocumentReference);
        this.historyRepo = dataSource.getRepository(DocumentReferenceHistory);
    }
}
