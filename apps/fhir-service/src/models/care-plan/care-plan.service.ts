import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConventionBasedSearchService } from '../../core/search/convention-based-search.service';
import { GenericFhirService } from '../../fhir-generics/generic-fhir.service';
import { CarePlanHistory } from './entities/care-plan-history.entity';
import { CarePlan } from './entities/care-plan.entity';

/**
 * Concrete service implementation for managing FHIR CarePlan resources.
 * 
 * This service extends the GenericFhirService to provide CarePlan-specific functionality
 * while inheriting all standard FHIR operations (create, read, update, delete, search, patch).
 * 
 * The service automatically handles:
 * - CarePlan resource lifecycle management
 * - Version control and optimistic concurrency
 * - Audit trail maintenance in care_plan_history table
 * - Integration with FHIR search parameters
 * - Transaction support for bundle operations
 * 
 * CarePlan resources represent the intention of how one or more practitioners
 * intend to deliver care for a particular patient, group, or community for a
 * period of time, possibly limited to care for a specific condition or set of conditions.
 * 
 * Common use cases include:
 * - Treatment plans for chronic conditions
 * - Post-surgical care protocols
 * - Preventive care schedules
 * - Care coordination across multiple providers
 * - Goal-oriented care planning
 * 
 * @example
 * ```typescript
 * // Inject and use the service
 * constructor(private carePlanService: CarePlanService) {}
 * 
 * // Create a new care plan
 * const carePlan = await this.carePlanService.create({
 *   resourceType: 'CarePlan',
 *   status: 'active',
 *   intent: 'plan',
 *   subject: { reference: 'Patient/123' },
 *   category: [{
 *     coding: [{
 *       system: 'http://hl7.org/fhir/us/core/CodeSystem/careplan-category',
 *       code: 'assess-plan'
 *     }]
 *   }]
 * });
 * 
 * // Search for active care plans for a patient
 * const results = await this.carePlanService.search({ 
 *   subject: 'Patient/123',
 *   status: 'active'
 * });
 * ```
 * 
 * @see {@link GenericFhirService} For inherited CRUD operations
 * @see {@link https://hl7.org/fhir/careplan.html} FHIR CarePlan specification
 */
@Injectable()
export class CarePlanService extends GenericFhirService<CarePlan, CarePlanHistory> {

    /**
     * Specifies the FHIR resource type managed by this service.
     * Used by the generic service for proper resource type handling and validation.
     */
    protected readonly resourceType = 'CarePlan';

    /**
     * Initializes the CarePlan service with required dependencies.
     * 
     * The constructor performs dependency injection and configures the service
     * to work with CarePlan and CarePlanHistory entities. Logging is automatically
     * initialized by the parent class.
     * 
     * @param repo - TypeORM repository for current CarePlan entities
     * @param historyRepo - TypeORM repository for CarePlan history/audit trail  
     * @param dataSource - Database connection and transaction manager
     * @param searchService - FHIR search operations handler
     */
    constructor(
        @InjectRepository(CarePlan)
        protected readonly repo: Repository<CarePlan>,

        @InjectRepository(CarePlanHistory)
        protected readonly historyRepo: Repository<CarePlanHistory>,

        protected readonly dataSource: DataSource,
        protected readonly searchService: ConventionBasedSearchService,
    ) {
        // Initialize parent service with core dependencies
        super(dataSource, searchService);

        // Configure repositories for CarePlan-specific operations
        // These assignments allow the generic service to operate on CarePlan entities
        this.currentRepo = repo;
        this.historyRepo = historyRepo;

        this.logger.log('CarePlan service initialized successfully');
    }

    // --- CarePlan-Specific Business Logic --- //

    /**
     * Extract subject ID from CarePlan resource for potential future indexing.
     * This could be used for custom queries or analytics.
     */
    private extractSubjectId(resource: any): string | undefined {
        try {
            const subjectRef = resource?.subject?.reference;
            if (subjectRef && typeof subjectRef === 'string') {
                // Extract ID from reference like "Patient/123" -> "123"
                const match = subjectRef.match(/^Patient\/(.+)$/);
                return match ? match[1] : undefined;
            }
        } catch (error) {
            this.logger.warn('Failed to extract subject ID from CarePlan resource', {
                error: error.message,
                resourceId: resource?.id
            });
        }
        return undefined;
    }

    /**
     * Extract encounter ID from CarePlan resource for potential future indexing.
     * This could be used for custom queries or analytics.
     */
    private extractEncounterId(resource: any): string | undefined {
        try {
            const encounterRef = resource?.encounter?.reference;
            if (encounterRef && typeof encounterRef === 'string') {
                // Extract ID from reference like "Encounter/123" -> "123"
                const match = encounterRef.match(/^Encounter\/(.+)$/);
                return match ? match[1] : undefined;
            }
        } catch (error) {
            this.logger.warn('Failed to extract encounter ID from CarePlan resource', {
                error: error.message,
                resourceId: resource?.id
            });
        }
        return undefined;
    }

    /**
     * Get active care plans for a specific patient.
     * This is a common query pattern for care coordination.
     */
    async getActiveCarePlansForPatient(patientId: string): Promise<any[]> {
        this.logger.debug(`Getting active care plans for patient: ${patientId}`);

        const searchResults = await this.search({
            subject: `Patient/${patientId}`,
            status: 'active'
        });

        return searchResults.entry?.map((entry: any) => entry.resource) || [];
    }

    /**
     * Get care plans by category for a patient.
     * Useful for filtering care plans by type (e.g., treatment plans, preventive care).
     */
    async getCarePlansByCategory(patientId: string, categoryCode: string): Promise<any[]> {
        this.logger.debug(`Getting care plans for patient ${patientId} with category: ${categoryCode}`);

        const searchResults = await this.search({
            subject: `Patient/${patientId}`,
            category: categoryCode
        });

        return searchResults.entry?.map((entry: any) => entry.resource) || [];
    }

    /**
     * Get care plans associated with a specific encounter.
     * Useful for retrieving encounter-specific care planning.
     */
    async getCarePlansForEncounter(encounterId: string): Promise<any[]> {
        this.logger.debug(`Getting care plans for encounter: ${encounterId}`);

        const searchResults = await this.search({
            encounter: `Encounter/${encounterId}`
        });

        return searchResults.entry?.map((entry: any) => entry.resource) || [];
    }
}
