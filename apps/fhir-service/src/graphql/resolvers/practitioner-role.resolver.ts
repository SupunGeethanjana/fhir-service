import { Logger } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';
import { PractitionerRoleService } from '../../models/practitioner-role/practitioner-role.service';
import { PractitionerRoleType } from '../types/fhir-resource.type';

/**
 * GraphQL resolver for PractitionerRole resources.
 * 
 * This resolver provides GraphQL operations for managing PractitionerRole resources,
 * including queries for reading and searching, and mutations for creating, updating, and deleting.
 * 
 * The resolver follows FHIR REST API patterns adapted for GraphQL, providing:
 * - Individual resource operations (read, create, update, delete)
 * - Search operations with FHIR search parameters
 * - Patch operations for partial updates
 * - Proper error handling and logging
 */
@Resolver(() => PractitionerRoleType)
export class PractitionerRoleResolver {
    private readonly logger = new Logger(PractitionerRoleResolver.name);

    constructor(private readonly practitionerRoleService: PractitionerRoleService) { }

    /**
     * Read a single PractitionerRole by ID.
     * 
     * @param id The logical ID of the PractitionerRole resource
     * @returns The PractitionerRole resource or null if not found
     */
    @Query(() => PractitionerRoleType, { nullable: true })
    async practitionerRole(@Args('id', { type: () => ID }) id: string): Promise<PractitionerRoleType | null> {
        this.logger.debug(`GraphQL Query: Reading PractitionerRole with ID: ${id}`);

        try {
            const result = await this.practitionerRoleService.findById(id);
            this.logger.debug(`Successfully retrieved PractitionerRole: ${id}`);
            return result;
        } catch (error) {
            this.logger.error(`Error reading PractitionerRole ${id}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Search for PractitionerRoles with FHIR search parameters.
     * 
     * @param searchParams Object containing FHIR search parameters
     * @returns Bundle containing matching PractitionerRole resources
     */
    @Query(() => GraphQLJSON, { nullable: true })
    async practitionerRoles(@Args('params', { type: () => GraphQLJSON, nullable: true }) searchParams?: any): Promise<any> {
        this.logger.debug(`GraphQL Query: Searching PractitionerRoles with params:`, searchParams);

        try {
            const result = await this.practitionerRoleService.search(searchParams);
            this.logger.debug(`Search returned ${result.total} PractitionerRoles`);
            return result;
        } catch (error) {
            this.logger.error(`Error searching PractitionerRoles: ${error.message}`);
            throw error;
        }
    }

    /**
     * Create a new PractitionerRole resource.
     * 
     * @param practitionerRole The PractitionerRole resource to create
     * @returns The created PractitionerRole resource with assigned ID
     */
    @Mutation(() => PractitionerRoleType)
    async createPractitionerRole(@Args('practitionerRole', { type: () => GraphQLJSON }) practitionerRole: any): Promise<PractitionerRoleType> {
        this.logger.debug(`GraphQL Mutation: Creating new PractitionerRole`);

        try {
            const result = await this.practitionerRoleService.create(practitionerRole);
            this.logger.debug(`Successfully created PractitionerRole with ID: ${result.id}`);
            return result;
        } catch (error) {
            this.logger.error(`Error creating PractitionerRole: ${error.message}`);
            throw error;
        }
    }

    /**
     * Update an existing PractitionerRole resource.
     * 
     * @param id The logical ID of the PractitionerRole to update
     * @param practitionerRole The updated PractitionerRole resource
     * @returns The updated PractitionerRole resource
     */
    @Mutation(() => PractitionerRoleType)
    async updatePractitionerRole(
        @Args('id', { type: () => ID }) id: string,
        @Args('practitionerRole', { type: () => GraphQLJSON }) practitionerRole: any
    ): Promise<PractitionerRoleType> {
        this.logger.debug(`GraphQL Mutation: Updating PractitionerRole with ID: ${id}`);

        try {
            const result = await this.practitionerRoleService.update(id, practitionerRole);
            this.logger.debug(`Successfully updated PractitionerRole: ${id}`);
            return result;
        } catch (error) {
            this.logger.error(`Error updating PractitionerRole ${id}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Delete a PractitionerRole resource.
     * 
     * @param id The logical ID of the PractitionerRole to delete
     * @returns Success status
     */
    @Mutation(() => GraphQLJSON)
    async deletePractitionerRole(@Args('id', { type: () => ID }) id: string): Promise<any> {
        this.logger.debug(`GraphQL Mutation: Deleting PractitionerRole with ID: ${id}`);

        try {
            const result = await this.practitionerRoleService.delete(id);
            this.logger.debug(`Successfully deleted PractitionerRole: ${id}`);
            return result;
        } catch (error) {
            this.logger.error(`Error deleting PractitionerRole ${id}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Apply JSON Patch operations to a PractitionerRole resource.
     * 
     * @param id The logical ID of the PractitionerRole to patch
     * @param patch Array of JSON Patch operations
     * @returns The patched PractitionerRole resource
     */
    @Mutation(() => PractitionerRoleType)
    async patchPractitionerRole(
        @Args('id', { type: () => ID }) id: string,
        @Args('patch', { type: () => [GraphQLJSON] }) patch: any[]
    ): Promise<PractitionerRoleType> {
        this.logger.debug(`GraphQL Mutation: Patching PractitionerRole with ID: ${id}`);

        try {
            const result = await this.practitionerRoleService.patch(id, patch);
            this.logger.debug(`Successfully patched PractitionerRole: ${id}`);
            return result;
        } catch (error) {
            this.logger.error(`Error patching PractitionerRole ${id}: ${error.message}`);
            throw error;
        }
    }
}
