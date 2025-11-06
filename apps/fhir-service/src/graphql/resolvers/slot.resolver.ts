import { Logger } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';
import { SlotService } from '../../models/slot/slot.service';
import { FhirBundleOutput } from '../types/fhir-bundle-output.type';
import { SlotType } from '../types/fhir-resource.type';
import { SlotSearchInput } from '../types/fhir-search-inputs.type';

/**
 * GraphQL resolver for Slot resources.
 * 
 * This resolver provides GraphQL operations for managing Slot resources,
 * including queries for reading and searching, and mutations for creating, updating, and deleting.
 * 
 * The resolver follows FHIR REST API patterns adapted for GraphQL, providing:
 * - Individual resource operations (read, create, update, delete)
 * - Search operations with FHIR search parameters
 * - Patch operations for partial updates
 * - Proper error handling and logging
 */
@Resolver(() => SlotType)
export class SlotResolver {
    private readonly logger = new Logger(SlotResolver.name);

    constructor(private readonly slotService: SlotService) { }

    /**
     * Read a single Slot by ID.
     * 
     * @param id The logical ID of the Slot resource
     * @returns The Slot resource or null if not found
     */
    @Query(() => SlotType, { nullable: true })
    async getSlot(@Args('id', { type: () => ID }) id: string): Promise<SlotType | null> {
        this.logger.debug(`GraphQL Query: Reading Slot with ID: ${id}`);

        try {
            const result = await this.slotService.findById(id);
            this.logger.debug(`Successfully retrieved Slot: ${id}`);
            return result;
        } catch (error) {
            this.logger.error(`Error reading Slot ${id}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Search for Slots with FHIR search parameters.
     *
     * @param search Input object containing FHIR search parameters
     * @returns Bundle containing matching Slot resources
     */
    @Query(() => FhirBundleOutput, { nullable: true, description: 'Search for Slots with FHIR search parameters' })
    async getSlots(
        @Args('input', { type: () => SlotSearchInput, nullable: true }) input?: SlotSearchInput
    ): Promise<FhirBundleOutput> {
        this.logger.debug('GraphQL Query: Searching Slots with input:', input);
        try {
            const result = await this.slotService.search(input || {});
            this.logger.debug(`Search returned ${result.total} Slots`);
            return result;
        } catch (error) {
            this.logger.error(`Error searching Slots: ${error.message}`);
            throw error;
        }
    }

    /**
     * Create a new Slot resource.
     * 
     * @param slot The Slot resource to create
     * @returns The created Slot resource with assigned ID
     */
    @Mutation(() => SlotType)
    async createSlot(@Args('slot', { type: () => GraphQLJSON }) slot: any): Promise<SlotType> {
        this.logger.debug(`GraphQL Mutation: Creating new Slot`);

        try {
            const result = await this.slotService.create(slot);
            this.logger.debug(`Successfully created Slot with ID: ${result.id}`);
            return result;
        } catch (error) {
            this.logger.error(`Error creating Slot: ${error.message}`);
            throw error;
        }
    }

    /**
     * Update an existing Slot resource.
     * 
     * @param id The logical ID of the Slot to update
     * @param slot The updated Slot resource
     * @returns The updated Slot resource
     */
    @Mutation(() => SlotType)
    async updateSlot(
        @Args('id', { type: () => ID }) id: string,
        @Args('slot', { type: () => GraphQLJSON }) slot: any
    ): Promise<SlotType> {
        this.logger.debug(`GraphQL Mutation: Updating Slot with ID: ${id}`);

        try {
            const result = await this.slotService.update(id, slot);
            this.logger.debug(`Successfully updated Slot: ${id}`);
            return result;
        } catch (error) {
            this.logger.error(`Error updating Slot ${id}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Delete a Slot resource.
     * 
     * @param id The logical ID of the Slot to delete
     * @returns Success status
     */
    @Mutation(() => GraphQLJSON)
    async deleteSlot(@Args('id', { type: () => ID }) id: string): Promise<any> {
        this.logger.debug(`GraphQL Mutation: Deleting Slot with ID: ${id}`);

        try {
            const result = await this.slotService.delete(id);
            this.logger.debug(`Successfully deleted Slot: ${id}`);
            return result;
        } catch (error) {
            this.logger.error(`Error deleting Slot ${id}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Apply JSON Patch operations to a Slot resource.
     * 
     * @param id The logical ID of the Slot to patch
     * @param patch Array of JSON Patch operations
     * @returns The patched Slot resource
     */
    @Mutation(() => SlotType)
    async patchSlot(
        @Args('id', { type: () => ID }) id: string,
        @Args('patch', { type: () => [GraphQLJSON] }) patch: any[]
    ): Promise<SlotType> {
        this.logger.debug(`GraphQL Mutation: Patching Slot with ID: ${id}`);

        try {
            const result = await this.slotService.patch(id, patch);
            this.logger.debug(`Successfully patched Slot: ${id}`);
            return result;
        } catch (error) {
            this.logger.error(`Error patching Slot ${id}: ${error.message}`);
            throw error;
        }
    }
}
