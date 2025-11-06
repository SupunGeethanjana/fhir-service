import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConventionBasedSearchService } from '../../core/search/convention-based-search.service';
import { GenericFhirService } from '../../fhir-generics/generic-fhir.service';
import { ScheduleHistory } from './entities/schedule-history.entity';
import { Schedule } from './entities/schedule.entity';

/**
 * Concrete service for the Schedule resource.
 *
 * This service is responsible for handling all business logic related to Schedule resources.
 * It extends the GenericFhirService, which provides the implementation for all standard
 * FHIR CRUD (Create, Read, Update, Delete) and search operations. This keeps the code
 * here lean, consistent, and focused on Schedule-specific configurations.
 */
@Injectable()
export class ScheduleService extends GenericFhirService<Schedule, ScheduleHistory> {
    protected readonly resourceType = 'Schedule';

    constructor(
        @InjectRepository(Schedule)
        protected readonly repo: Repository<Schedule>,

        @InjectRepository(ScheduleHistory)
        protected readonly historyRepo: Repository<ScheduleHistory>,

        protected readonly dataSource: DataSource,
        protected readonly searchService: ConventionBasedSearchService,
    ) {
        super(dataSource, searchService);
        this.currentRepo = repo;
        this.historyRepo = historyRepo;
    }

    // --- Schedule-Specific Business Logic Can Be Added Here --- //
}
