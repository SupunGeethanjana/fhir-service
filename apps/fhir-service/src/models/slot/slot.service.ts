import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConventionBasedSearchService } from '../../core/search/convention-based-search.service';
import { GenericFhirService } from '../../fhir-generics/generic-fhir.service';
import { SlotHistory } from './entities/slot-history.entity';
import { Slot } from './entities/slot.entity';

/**
 * Concrete service for the Slot resource.
 * 
 * This service is responsible for handling all business logic related to Slot resources.
 * It extends the GenericFhirService, which provides the implementation for all standard
 * FHIR CRUD (Create, Read, Update, Delete) and search operations. This keeps the code
 * here lean, consistent, and focused on Slot-specific configurations.
 * 
 * Slot resources provide time-slots that can be booked using appointments.
 * They define when services or resources are available and contain information about:
 * - Availability and booking status
 * - Service types and specialties
 * - Schedule references and time boundaries
 * - Appointment constraints and overbooked indicators
 */
@Injectable()
export class SlotService extends GenericFhirService<Slot, SlotHistory> {

    /**
     * Sets the specific FHIR resource type that this service manages.
     * The generic service uses this string to correctly handle resourceType properties.
     */
    protected readonly resourceType = 'Slot';

    /**
     * The constructor injects all necessary dependencies.
     * @param repo The TypeORM repository for the `Slot` entity (the current table).
     * @param historyRepo The TypeORM repository for the `SlotHistory` entity.
     * @param dataSource The main TypeORM DataSource, used for managing database transactions.
     * @param searchService The shared, core search service for handling search logic.
     */
    constructor(
        @InjectRepository(Slot)
        protected readonly repo: Repository<Slot>,

        @InjectRepository(SlotHistory)
        protected readonly historyRepo: Repository<SlotHistory>,

        protected readonly dataSource: DataSource,
        protected readonly searchService: ConventionBasedSearchService,
    ) {
        // Pass the core dependencies up to the parent GenericFhirService constructor.
        super(dataSource, searchService);

        // Assign the specific repositories for this resource to the generic properties
        // defined in the parent class. This "configures" the generic service to work
        // with the Slot and SlotHistory tables.
        this.currentRepo = repo;
        this.historyRepo = historyRepo;
    }

    // --- Slot-Specific Business Logic Can Be Added Here --- //

    /**
     * Example of Slot-specific business logic that could be implemented.
     * 
     * This method demonstrates how to add resource-specific functionality
     * while maintaining consistency with the FHIR specification.
     * 
     * @example
     * ```typescript
     * // Find available slots by schedule
     * async findAvailableSlotsBySchedule(scheduleId: string): Promise<Slot[]> {
     *   this.logger.debug(`Searching for available slots for schedule: ${scheduleId}`);
     *   
     *   try {
     *     const searchResults = await this.search({
     *       schedule: scheduleId,
     *       status: 'free'
     *     });
     *     
     *     return searchResults.entry?.map(entry => entry.resource) || [];
     *   } catch (error) {
     *     this.logger.error(`Error searching for available slots: ${error.message}`);
     *     throw error;
     *   }
     * }
     * 
     * // Find slots by date range
     * async findSlotsByDateRange(startDate: string, endDate: string): Promise<Slot[]> {
     *   this.logger.debug(`Searching for slots between ${startDate} and ${endDate}`);
     *   
     *   try {
     *     const searchResults = await this.search({
     *       start: `ge${startDate}`,
     *       start: `le${endDate}`
     *     });
     *     
     *     return searchResults.entry?.map(entry => entry.resource) || [];
     *   } catch (error) {
     *     this.logger.error(`Error searching for slots by date range: ${error.message}`);
     *     throw error;
     *   }
     * }
     * 
     * // Find slots by service type
     * async findSlotsByServiceType(serviceType: string): Promise<Slot[]> {
     *   this.logger.debug(`Searching for slots with service type: ${serviceType}`);
     *   
     *   try {
     *     const searchResults = await this.search({
     *       'service-type': serviceType
     *     });
     *     
     *     return searchResults.entry?.map(entry => entry.resource) || [];
     *   } catch (error) {
     *     this.logger.error(`Error searching for slots by service type: ${error.message}`);
     *     throw error;
     *   }
     * }
     * 
     * // Check if slot is available for booking
     * async isSlotAvailable(slotId: string): Promise<boolean> {
     *   try {
     *     const slot = await this.findById(slotId);
     *     return slot && slot.status === 'free' && !slot.overbooked;
     *   } catch (error) {
     *     this.logger.error(`Error checking slot availability: ${error.message}`);
     *     return false;
     *   }
     * }
     * 
     * // Update slot status
     * async updateSlotStatus(slotId: string, status: string): Promise<any> {
     *   this.logger.debug(`Updating slot ${slotId} status to: ${status}`);
     *   
     *   try {
     *     const slot = await this.findById(slotId);
     *     if (!slot) {
     *       throw new Error(`Slot ${slotId} not found`);
     *     }
     *     
     *     const updatedSlot = {
     *       ...slot,
     *       status: status
     *     };
     *     
     *     return await this.update(slotId, updatedSlot);
     *   } catch (error) {
     *     this.logger.error(`Error updating slot status: ${error.message}`);
     *     throw error;
     *   }
     * }
     * ```
     */
}
