import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConventionBasedSearchService } from '../../core/search/convention-based-search.service';
import { GenericFhirService } from '../../fhir-generics/generic-fhir.service';
import { ProcedureHistory } from './entities/procedure-history.entity';
import { Procedure } from './entities/procedure.entity';

/**
 * Concrete service for the Procedure resource.
 * 
 * This service is responsible for handling all business logic related to Procedure resources.
 * It extends the GenericFhirService, which provides the implementation for all standard
 * FHIR CRUD (Create, Read, Update, Delete) and search operations. This keeps the code
 * here lean, consistent, and focused on Procedure-specific configurations.
 */
@Injectable()
export class ProcedureService extends GenericFhirService<Procedure, ProcedureHistory> {

  /**
   * Sets the specific FHIR resource type that this service manages.
   * The generic service uses this string to correctly handle resourceType properties.
   */
  protected readonly resourceType = 'Procedure';

  /**
   * The constructor injects all necessary dependencies.
   * @param repo The TypeORM repository for the `Procedure` entity (the current table).
   * @param historyRepo The TypeORM repository for the `ProcedureHistory` entity.
   * @param dataSource The main TypeORM DataSource, used for managing database transactions.
   * @param searchService The shared, core search service for handling search logic.
   */
  constructor(
    @InjectRepository(Procedure)
    protected readonly repo: Repository<Procedure>,

    @InjectRepository(ProcedureHistory)
    protected readonly historyRepo: Repository<ProcedureHistory>,

    protected readonly dataSource: DataSource,
    protected readonly searchService: ConventionBasedSearchService,
  ) {
    // Pass the core dependencies up to the parent GenericFhirService constructor.
    super(dataSource, searchService);

    // Assign the specific repositories for this resource to the generic properties
    // defined in the parent class. This "configures" the generic service to work
    // with the Procedure and ProcedureHistory tables.
    this.currentRepo = repo;
    this.historyRepo = historyRepo;
  }
}
