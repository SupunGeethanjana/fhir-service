import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConventionBasedSearchService } from '../../core/search/convention-based-search.service';
import { GenericFhirService } from '../../fhir-generics/generic-fhir.service';
import { GoalHistory } from './entities/goal-history.entity';
import { Goal } from './entities/goal.entity';

@Injectable()
export class GoalService extends GenericFhirService<Goal, GoalHistory> {
    protected readonly resourceType = 'Goal';

    constructor(
        dataSource: DataSource,
        searchService: ConventionBasedSearchService
    ) {
        super(dataSource, searchService);
        this.currentRepo = dataSource.getRepository(Goal);
        this.historyRepo = dataSource.getRepository(GoalHistory);
    }
}
