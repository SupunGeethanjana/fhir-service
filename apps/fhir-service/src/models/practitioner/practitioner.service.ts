import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConventionBasedSearchService } from '../../core/search/convention-based-search.service';
import { GenericFhirService } from '../../fhir-generics/generic-fhir.service';
import { PractitionerHistory } from './entities/practitioner-history.entity';
import { Practitioner } from './entities/practitioner.entity';

/**
 * Concrete service implementation for managing FHIR Practitioner resources.
 * 
 * This service extends the GenericFhirService to provide Practitioner-specific functionality
 * while inheriting all standard FHIR operations (create, read, update, delete, search, patch).
 * 
 * The service automatically handles:
 * - Practitioner resource lifecycle management
 * - Version control and optimistic concurrency
 * - Audit trail maintenance in practitioner_history table
 * - Integration with FHIR search parameters
 * - Transaction support for bundle operations
 * 
 * Business rules and validations specific to Practitioner resources can be added
 * to this service while leveraging the robust foundation provided by the generic service.
 * 
 * @example
 * ```typescript
 * // Inject and use the service
 * constructor(private practitionerService: PractitionerService) {}
 * 
 * // Create a new practitioner
 * const practitioner = await this.practitionerService.create({
 *   resourceType: 'Practitioner',
 *   name: [{ family: 'Smith', given: ['John'] }],
 *   active: true
 * });
 * 
 * // Search for practitioners
 * const results = await this.practitionerService.search({ 
 *   family: 'Smith', 
 *   active: 'true' 
 * });
 * ```
 * 
 * @see {@link GenericFhirService} For inherited CRUD operations
 * @see {@link https://www.hl7.org/fhir/practitioner.html} FHIR Practitioner Resource Specification
 */
@Injectable()
export class PractitionerService extends GenericFhirService<Practitioner, PractitionerHistory> {

    /**
     * Specifies the FHIR resource type managed by this service.
     * Used by the generic service for proper resource type handling and validation.
     */
    protected readonly resourceType = 'Practitioner';

    /**
     * Initializes the Practitioner service with required dependencies.
     * 
     * The constructor performs dependency injection and configures the service
     * to work with Practitioner and PractitionerHistory entities. Logging is automatically
     * initialized by the parent class.
     * 
     * @param repo - TypeORM repository for current Practitioner entities
     * @param historyRepo - TypeORM repository for Practitioner history/audit trail  
     * @param dataSource - Database connection and transaction manager
     * @param searchService - FHIR search operations handler
     */
    constructor(
        @InjectRepository(Practitioner)
        protected readonly repo: Repository<Practitioner>,

        @InjectRepository(PractitionerHistory)
        protected readonly historyRepo: Repository<PractitionerHistory>,

        protected readonly dataSource: DataSource,
        protected readonly searchService: ConventionBasedSearchService,
    ) {
        // Initialize parent service with core dependencies
        super(dataSource, searchService);

        // Configure repositories for Practitioner-specific operations
        // These assignments allow the generic service to operate on Practitioner entities
        this.currentRepo = repo;
        this.historyRepo = historyRepo;

        this.logger.log('Practitioner service initialized successfully');
    }

    // --- Practitioner-Specific Business Logic Can Be Added Here --- //

    /**
     * Example of Practitioner-specific business logic that could be implemented.
     * 
     * This method demonstrates how to add resource-specific functionality
     * while maintaining consistency with the FHIR specification.
     * 
     * @example
     * ```typescript
     * // Find practitioners by National Provider Identifier
     * async findByNpi(npi: string): Promise<Practitioner | null> {
     *   this.logger.debug(`Searching for practitioner with NPI: ${npi}`);
     *   
     *   try {
     *     const searchResults = await this.search({
     *       identifier: `npi|${npi}`
     *     });
     *     
     *     if (searchResults.entry && searchResults.entry.length > 0) {
     *       this.logger.debug(`Found practitioner with NPI: ${npi}`);
     *       return searchResults.entry[0].resource;
     *     }
     *     
     *     this.logger.debug(`No practitioner found with NPI: ${npi}`);
     *     return null;
     *   } catch (error) {
     *     this.logger.error(`Error searching for practitioner with NPI ${npi}:`, error);
     *     throw error;
     *   }
     * }
     * 
     * // Validate practitioner data before creation
     * async validateAndCreate(practitionerData: any): Promise<any> {
     *   this.logger.debug('Validating practitioner data before creation');
     *   
     *   // Add practitioner-specific validation logic here
     *   if (!practitionerData.name || practitionerData.name.length === 0) {
     *     throw new Error('Practitioner must have at least one name');
     *   }
     *   
     *   // Delegate to generic create method
     *   return this.create(practitionerData);
     * }
     * ```
     */

    /**
     * Find practitioners by specialty.
     * 
     * This method demonstrates how to add Practitioner-specific search functionality
     * that leverages the FHIR search capabilities.
     * 
     * @param specialty - The specialty code to search for
     * @returns Promise resolving to search results containing matching practitioners
     * 
     * @example
     * ```typescript
     * // Find all cardiologists
     * const cardiologists = await this.practitionerService.findBySpecialty('394579002');
     * ```
     */
    async findBySpecialty(specialty: string): Promise<any> {
        this.logger.debug(`Searching for practitioners with specialty: ${specialty}`);

        try {
            const searchResults = await this.search({
                specialty: specialty
            });

            this.logger.debug(`Found ${searchResults.entry?.length || 0} practitioners with specialty: ${specialty}`);
            return searchResults;
        } catch (error) {
            this.logger.error(`Error searching for practitioners with specialty ${specialty}:`, error);
            throw error;
        }
    }

    /**
     * Find active practitioners by name.
     * 
     * This method provides a convenient way to search for active practitioners
     * by their family and/or given names.
     * 
     * @param family - Family name to search for
     * @param given - Given name to search for (optional)
     * @returns Promise resolving to search results containing matching practitioners
     * 
     * @example
     * ```typescript
     * // Find practitioners by family name
     * const smiths = await this.practitionerService.findByName('Smith');
     * 
     * // Find practitioners by full name
     * const johnSmiths = await this.practitionerService.findByName('Smith', 'John');
     * ```
     */
    async findByName(family: string, given?: string): Promise<any> {
        this.logger.debug(`Searching for practitioners with name: ${given || ''} ${family}`);

        try {
            const searchParams: any = {
                family: family,
                active: 'true'
            };

            if (given) {
                searchParams.given = given;
            }

            const searchResults = await this.search(searchParams);

            this.logger.debug(`Found ${searchResults.entry?.length || 0} practitioners with name: ${given || ''} ${family}`);
            return searchResults;
        } catch (error) {
            this.logger.error(`Error searching for practitioners with name ${given || ''} ${family}:`, error);
            throw error;
        }
    }
}
