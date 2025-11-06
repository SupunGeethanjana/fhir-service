import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConventionBasedSearchService } from '../../core/search/convention-based-search.service';
import { GenericFhirService } from '../../fhir-generics/generic-fhir.service';
import { FamilyMemberHistoryHistory } from './entities/family-member-history-history.entity';
import { FamilyMemberHistory } from './entities/family-member-history.entity';

/**
 * Concrete service for the FamilyMemberHistory resource.
 * 
 * This service is responsible for handling all business logic related to FamilyMemberHistory resources.
 * It extends the GenericFhirService, which provides the implementation for all standard
 * FHIR CRUD (Create, Read, Update, Delete) and search operations. This keeps the code
 * here lean, consistent, and focused on FamilyMemberHistory-specific configurations.
 */
@Injectable()
export class FamilyMemberHistoryService extends GenericFhirService<FamilyMemberHistory, FamilyMemberHistoryHistory> {

  /**
   * Sets the specific FHIR resource type that this service manages.
   * The generic service uses this string to correctly handle resourceType properties.
   */
  protected readonly resourceType = 'FamilyMemberHistory';

  /**
   * The constructor injects all necessary dependencies.
   * @param repo The TypeORM repository for the `FamilyMemberHistory` entity (the current table).
   * @param historyRepo The TypeORM repository for the `FamilyMemberHistoryHistory` entity.
   * @param dataSource The main TypeORM DataSource, used for managing database transactions.
   * @param searchService The shared, core search service for handling search logic.
   */
  constructor(
    @InjectRepository(FamilyMemberHistory)
    protected readonly repo: Repository<FamilyMemberHistory>,

    @InjectRepository(FamilyMemberHistoryHistory)
    protected readonly historyRepo: Repository<FamilyMemberHistoryHistory>,

    protected readonly dataSource: DataSource,
    protected readonly searchService: ConventionBasedSearchService,
  ) {
    // Pass the core dependencies up to the parent GenericFhirService constructor.
    super(dataSource, searchService);

    // Assign the specific repositories for this resource to the generic properties
    // defined in the parent class. This "configures" the generic service to work
    // with the FamilyMemberHistory and FamilyMemberHistoryHistory tables.
    this.currentRepo = repo;
    this.historyRepo = historyRepo;
  }
}