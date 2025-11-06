import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConventionBasedSearchService } from '../../core/search/convention-based-search.service';
import { GenericFhirService } from '../../fhir-generics/generic-fhir.service';
import { CareTeamHistory } from './entities/care-team-history.entity';
import { CareTeam } from './entities/care-team.entity';

@Injectable()
export class CareTeamService extends GenericFhirService<CareTeam, CareTeamHistory> {
    protected readonly resourceType = 'CareTeam';

    constructor(
        @InjectRepository(CareTeam)
        protected readonly repo: Repository<CareTeam>,

        @InjectRepository(CareTeamHistory)
        protected readonly historyRepo: Repository<CareTeamHistory>,

        protected readonly dataSource: DataSource,
        protected readonly searchService: ConventionBasedSearchService,
    ) {
        super(dataSource, searchService);
        this.currentRepo = repo;
        this.historyRepo = historyRepo;
        this.logger.log('CareTeam service initialized successfully');
    }

    // Add CareTeam-specific business logic here if needed
}
