import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConventionBasedSearchService } from '../../core/search/convention-based-search.service';
import { GenericFhirService } from '../../fhir-generics/generic-fhir.service';
import { EncounterHistory } from './entities/encounter-history.entity';
import { Encounter } from './entities/encounter.entity';

/**
 * Concrete service for the Encounter resource.
 * 
 * This service is responsible for handling all business logic related to Encounter resources.
 * It extends the GenericFhirService, which provides the implementation for all standard
 * FHIR CRUD (Create, Read, Update, Delete) and search operations. This keeps the code
 * here lean, consistent, and focused on Encounter-specific configurations.
 */
@Injectable()
export class EncounterService extends GenericFhirService<Encounter, EncounterHistory> {

  /**
   * Sets the specific FHIR resource type that this service manages.
   * The generic service uses this string to correctly handle resourceType properties.
   */
  protected readonly resourceType = 'Encounter';

  /**
   * The constructor injects all necessary dependencies.
   * @param repo The TypeORM repository for the `Encounter` entity (the current table).
   * @param historyRepo The TypeORM repository for the `EncounterHistory` entity.
   * @param dataSource The main TypeORM DataSource, used for managing database transactions.
   * @param searchService The shared, core search service for handling search logic.
   */
  constructor(
    @InjectRepository(Encounter)
    protected readonly repo: Repository<Encounter>,

    @InjectRepository(EncounterHistory)
    protected readonly historyRepo: Repository<EncounterHistory>,

    protected readonly dataSource: DataSource,
    protected readonly searchService: ConventionBasedSearchService,
  ) {
    // Pass the core dependencies up to the parent GenericFhirService constructor.
    super(dataSource, searchService);

    // Assign the specific repositories for this resource to the generic properties
    // defined in the parent class. This "configures" the generic service to work
    // with the Encounter and EncounterHistory tables.
    this.currentRepo = repo;
    this.historyRepo = historyRepo;
  }
}
