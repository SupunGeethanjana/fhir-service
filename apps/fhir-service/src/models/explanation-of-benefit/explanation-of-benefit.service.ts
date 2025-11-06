import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConventionBasedSearchService } from '../../core/search/convention-based-search.service';
import { GenericFhirService } from '../../fhir-generics/generic-fhir.service';
import { ExplanationOfBenefitHistory } from './entities/explanation-of-benefit-history.entity';
import { ExplanationOfBenefit } from './entities/explanation-of-benefit.entity';

@Injectable()
export class ExplanationOfBenefitService extends GenericFhirService<ExplanationOfBenefit, ExplanationOfBenefitHistory> {
    protected readonly resourceType = 'ExplanationOfBenefit';

    constructor(
        dataSource: DataSource,
        searchService: ConventionBasedSearchService
    ) {
        super(dataSource, searchService);
        this.currentRepo = dataSource.getRepository(ExplanationOfBenefit);
        this.historyRepo = dataSource.getRepository(ExplanationOfBenefitHistory);
    }
}
