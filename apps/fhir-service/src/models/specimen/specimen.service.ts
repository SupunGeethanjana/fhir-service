import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConventionBasedSearchService } from '../../core/search/convention-based-search.service';
import { GenericFhirService } from '../../fhir-generics/generic-fhir.service';
import { SpecimenHistory } from './entities/specimen-history.entity';
import { Specimen } from './entities/specimen.entity';

/**
 * Concrete service for the Specimen resource.
 * 
 * This service is responsible for handling all business logic related to Specimen resources.
 * It extends the GenericFhirService, which provides the implementation for all standard
 * FHIR CRUD (Create, Read, Update, Delete) and search operations. This keeps the code
 * here lean, consistent, and focused on Specimen-specific configurations.
 */
@Injectable()
export class SpecimenService extends GenericFhirService<Specimen, SpecimenHistory> {

    /**
     * Sets the specific FHIR resource type that this service manages.
     * The generic service uses this string to correctly handle resourceType properties.
     */
    protected readonly resourceType = 'Specimen';

    /**
     * The constructor injects all necessary dependencies.
     * @param repo The TypeORM repository for the `Specimen` entity (the current table).
     * @param historyRepo The TypeORM repository for the `SpecimenHistory` entity.
     * @param dataSource The main TypeORM DataSource, used for managing database transactions.
     * @param searchService The shared, core search service for handling search logic.
     */
    constructor(
        @InjectRepository(Specimen)
        protected readonly repo: Repository<Specimen>,

        @InjectRepository(SpecimenHistory)
        protected readonly historyRepo: Repository<SpecimenHistory>,

        protected readonly dataSource: DataSource,
        protected readonly searchService: ConventionBasedSearchService,
    ) {
        // Pass the core dependencies up to the parent GenericFhirService constructor.
        super(dataSource, searchService);

        // Assign the specific repositories for this resource to the generic properties
        // defined in the parent class. This "configures" the generic service to work
        // with the Specimen and SpecimenHistory tables.
        this.currentRepo = repo;
        this.historyRepo = historyRepo;
    }
}
