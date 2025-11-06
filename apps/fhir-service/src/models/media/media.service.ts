import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConventionBasedSearchService } from '../../core/search/convention-based-search.service';
import { GenericFhirService } from '../../fhir-generics/generic-fhir.service';
import { MediaHistory } from './entities/media-history.entity';
import { Media } from './entities/media.entity';

/**
 * Concrete service for the Media resource.
 * 
 * This service is responsible for handling all business logic related to Media resources.
 * It extends the GenericFhirService, which provides the implementation for all standard
 * FHIR CRUD (Create, Read, Update, Delete) and search operations. This keeps the code
 * here lean, consistent, and focused on Media-specific configurations.
 */
@Injectable()
export class MediaService extends GenericFhirService<Media, MediaHistory> {

    /**
     * Sets the specific FHIR resource type that this service manages.
     * The generic service uses this string to correctly handle resourceType properties.
     */
    protected readonly resourceType = 'Media';

    /**
     * The constructor injects all necessary dependencies.
     * @param repo The TypeORM repository for the `Media` entity (the current table).
     * @param historyRepo The TypeORM repository for the `MediaHistory` entity.
     * @param dataSource The main TypeORM DataSource, used for managing database transactions.
     * @param searchService The shared, core search service for handling search logic.
     */
    constructor(
        @InjectRepository(Media)
        protected readonly repo: Repository<Media>,

        @InjectRepository(MediaHistory)
        protected readonly historyRepo: Repository<MediaHistory>,

        protected readonly dataSource: DataSource,
        protected readonly searchService: ConventionBasedSearchService,
    ) {
        // Pass the core dependencies up to the parent GenericFhirService constructor.
        super(dataSource, searchService);

        // Assign the specific repositories for this resource to the generic properties
        // defined in the parent class. This "configures" the generic service to work
        // with the Media and MediaHistory tables.
        this.currentRepo = repo;
        this.historyRepo = historyRepo;
    }
}
