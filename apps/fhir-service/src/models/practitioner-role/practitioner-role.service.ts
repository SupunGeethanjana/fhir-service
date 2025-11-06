import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConventionBasedSearchService } from '../../core/search/convention-based-search.service';
import { GenericFhirService } from '../../fhir-generics/generic-fhir.service';
import { PractitionerRoleHistory } from './entities/practitioner-role-history.entity';
import { PractitionerRole } from './entities/practitioner-role.entity';

/**
 * Concrete service for the PractitionerRole resource.
 * 
 * This service is responsible for handling all business logic related to PractitionerRole resources.
 * It extends the GenericFhirService, which provides the implementation for all standard
 * FHIR CRUD (Create, Read, Update, Delete) and search operations. This keeps the code
 * here lean, consistent, and focused on PractitionerRole-specific configurations.
 * 
 * PractitionerRole resources represent specific roles that practitioners perform at 
 * organizations, including their specialties, locations, and availability. They contain:
 * - Role definitions and authorization periods
 * - Organizational relationships and location assignments
 * - Specialty and service mappings
 * - Contact information and availability schedules
 */
@Injectable()
export class PractitionerRoleService extends GenericFhirService<PractitionerRole, PractitionerRoleHistory> {

    /**
     * Sets the specific FHIR resource type that this service manages.
     * The generic service uses this string to correctly handle resourceType properties.
     */
    protected readonly resourceType = 'PractitionerRole';

    /**
     * The constructor injects all necessary dependencies.
     * @param repo The TypeORM repository for the `PractitionerRole` entity (the current table).
     * @param historyRepo The TypeORM repository for the `PractitionerRoleHistory` entity.
     * @param dataSource The main TypeORM DataSource, used for managing database transactions.
     * @param searchService The shared, core search service for handling search logic.
     */
    constructor(
        @InjectRepository(PractitionerRole)
        protected readonly repo: Repository<PractitionerRole>,

        @InjectRepository(PractitionerRoleHistory)
        protected readonly historyRepo: Repository<PractitionerRoleHistory>,

        protected readonly dataSource: DataSource,
        protected readonly searchService: ConventionBasedSearchService,
    ) {
        // Pass the core dependencies up to the parent GenericFhirService constructor.
        super(dataSource, searchService);

        // Assign the specific repositories for this resource to the generic properties
        // defined in the parent class. This "configures" the generic service to work
        // with the PractitionerRole and PractitionerRoleHistory tables.
        this.currentRepo = repo;
        this.historyRepo = historyRepo;
    }

    // --- PractitionerRole-Specific Business Logic Can Be Added Here --- //

    /**
     * Example of PractitionerRole-specific business logic that could be implemented.
     * 
     * This method demonstrates how to add resource-specific functionality
     * while maintaining consistency with the FHIR specification.
     * 
     * @example
     * ```typescript
     * // Find practitioner roles by organization
     * async findRolesByOrganization(organizationId: string): Promise<PractitionerRole[]> {
     *   this.logger.debug(`Searching for practitioner roles in organization: ${organizationId}`);
     *   
     *   try {
     *     const searchResults = await this.search({
     *       organization: organizationId,
     *       active: 'true'
     *     });
     *     
     *     return searchResults.entry?.map(entry => entry.resource) || [];
     *   } catch (error) {
     *     this.logger.error(`Error searching for roles by organization: ${error.message}`);
     *     throw error;
     *   }
     * }
     * 
     * // Find practitioner roles by specialty
     * async findRolesBySpecialty(specialtyCode: string): Promise<PractitionerRole[]> {
     *   this.logger.debug(`Searching for practitioner roles with specialty: ${specialtyCode}`);
     *   
     *   try {
     *     const searchResults = await this.search({
     *       specialty: specialtyCode,
     *       active: 'true'
     *     });
     *     
     *     return searchResults.entry?.map(entry => entry.resource) || [];
     *   } catch (error) {
     *     this.logger.error(`Error searching for roles by specialty: ${error.message}`);
     *     throw error;
     *   }
     * }
     * 
     * // Find practitioner roles by location
     * async findRolesByLocation(locationId: string): Promise<PractitionerRole[]> {
     *   this.logger.debug(`Searching for practitioner roles at location: ${locationId}`);
     *   
     *   try {
     *     const searchResults = await this.search({
     *       location: locationId,
     *       active: 'true'
     *     });
     *     
     *     return searchResults.entry?.map(entry => entry.resource) || [];
     *   } catch (error) {
     *     this.logger.error(`Error searching for roles by location: ${error.message}`);
     *     throw error;
     *   }
     * }
     * 
     * // Find all roles for a specific practitioner
     * async findRolesByPractitioner(practitionerId: string): Promise<PractitionerRole[]> {
     *   this.logger.debug(`Searching for roles for practitioner: ${practitionerId}`);
     *   
     *   try {
     *     const searchResults = await this.search({
     *       practitioner: practitionerId
     *     });
     *     
     *     return searchResults.entry?.map(entry => entry.resource) || [];
     *   } catch (error) {
     *     this.logger.error(`Error searching for roles by practitioner: ${error.message}`);
     *     throw error;
     *   }
     * }
     * 
     * // Find available practitioners for a specific service
     * async findAvailablePractitionersByService(serviceCode: string): Promise<PractitionerRole[]> {
     *   this.logger.debug(`Searching for available practitioners for service: ${serviceCode}`);
     *   
     *   try {
     *     const searchResults = await this.search({
     *       service: serviceCode,
     *       active: 'true'
     *     });
     *     
     *     return searchResults.entry?.map(entry => entry.resource) || [];
     *   } catch (error) {
     *     this.logger.error(`Error searching for practitioners by service: ${error.message}`);
     *     throw error;
     *   }
     * }
     * 
     * // Check if practitioner role is currently active
     * async isRoleActive(roleId: string): Promise<boolean> {
     *   try {
     *     const role = await this.findById(roleId);
     *     if (!role) return false;
     *     
     *     const now = new Date();
     *     const isActive = role.active !== false;
     *     const isInPeriod = !role.period || 
     *       (!role.period.start || new Date(role.period.start) <= now) &&
     *       (!role.period.end || new Date(role.period.end) >= now);
     *     
     *     return isActive && isInPeriod;
     *   } catch (error) {
     *     this.logger.error(`Error checking role active status: ${error.message}`);
     *     return false;
     *   }
     * }
     * 
     * // Find practitioner roles by contact information
     * async findRolesByContact(email?: string, phone?: string): Promise<PractitionerRole[]> {
     *   this.logger.debug(`Searching for practitioner roles by contact - email: ${email}, phone: ${phone}`);
     *   
     *   try {
     *     const searchParams: any = {};
     *     
     *     if (email) {
     *       searchParams.email = email;
     *     }
     *     
     *     if (phone) {
     *       searchParams.phone = phone;
     *     }
     *     
     *     const searchResults = await this.search(searchParams);
     *     return searchResults.entry?.map(entry => entry.resource) || [];
     *   } catch (error) {
     *     this.logger.error(`Error searching for roles by contact: ${error.message}`);
     *     throw error;
     *   }
     * }
     * 
     * // Update practitioner role availability
     * async updateRoleAvailability(roleId: string, availableTime: any[], notAvailable?: any[]): Promise<any> {
     *   this.logger.debug(`Updating availability for practitioner role: ${roleId}`);
     *   
     *   try {
     *     const role = await this.findById(roleId);
     *     if (!role) {
     *       throw new Error(`PractitionerRole ${roleId} not found`);
     *     }
     *     
     *     const updatedRole = {
     *       ...role,
     *       availableTime: availableTime,
     *       notAvailable: notAvailable || role.notAvailable
     *     };
     *     
     *     return await this.update(roleId, updatedRole);
     *   } catch (error) {
     *     this.logger.error(`Error updating role availability: ${error.message}`);
     *     throw error;
     *   }
     * }
     * ```
     */
}
