import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as jsonpatch from 'fast-json-patch';
// import { ParsedQs } from 'qs';
import { DataSource, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ConventionBasedSearchService } from '../core/search/convention-based-search.service';
import { CreateOrUpdateOptions, FhirResourceService } from './fhir-resource-service.interface';

/**
 * Abstract base service providing generic CRUD operations for FHIR resources.
 * 
 * This service implements the core FHIR resource lifecycle management including:
 * - Resource creation with automatic versioning
 * - Resource updates with optimistic concurrency control
 * - Resource patching using JSON Patch operations
 * - Automatic history tracking for all modifications
 * - Integration with FHIR search capabilities
 * 
 * All operations are performed within database transactions to ensure data consistency.
 * Each resource modification creates a new version and preserves the complete history.
 * 
 * @template T - The entity type representing the current version of the resource
 * @template H - The entity type representing the historical versions of the resource
 * 
 * @example
 * ```typescript
 * @Injectable()
 * export class PatientService extends GenericFhirService<Patient, PatientHistory> {
 *   protected readonly resourceType = 'Patient';
 *   // ... constructor and configuration
 * }
 * ```
 * 
 * @abstract
 * @class GenericFhirService
 * @implements {FhirResourceService}
 */
@Injectable()
export abstract class GenericFhirService<T, H> implements FhirResourceService {
  /**
   * Logger instance for this service, automatically named based on the concrete service class.
   */
  protected readonly logger = new Logger(this.constructor.name);

  /**
   * The FHIR resource type that this service manages (e.g., 'Patient', 'Observation').
   * Must be set by concrete implementations to ensure proper resource type handling.
   */
  protected readonly resourceType: string;

  /**
   * TypeORM repository for managing the current version of resources.
   * Injected and configured by concrete service implementations.
   */
  protected currentRepo: Repository<T>;

  /**
   * TypeORM repository for managing historical versions of resources.
   * Injected and configured by concrete service implementations.
   */
  protected historyRepo: Repository<H>;

  /**
   * Initializes the generic FHIR service with core dependencies.
   * 
   * @param dataSource - The TypeORM DataSource for database operations and transaction management
   * @param searchService - The service responsible for handling FHIR search operations
   */
  constructor(
    protected readonly dataSource: DataSource,
    protected readonly searchService: ConventionBasedSearchService
  ) {
    this.logger.log(`Initializing ${this.constructor.name}`);
  }

  /**
   * Searches for resources that match the specified query parameters.
   * 
   * Delegates to the ConventionBasedSearchService to perform FHIR-compliant search operations
   * including filtering, sorting, pagination, and parameter validation.
   * 
   * @param queryParams - The query parameters parsed from the HTTP request
   * @returns Promise resolving to a FHIR Bundle containing matching resources
   * 
   * @example
   * ```typescript
   * // Search for active patients named "John"
   * const results = await service.search({ 
   *   given: 'John', 
   *   active: 'true',
   *   _count: '10'
   * });
   * ```
   */
  async search(queryParams: Record<string, any>) {
    this.logger.debug(`Searching ${this.resourceType} resources with parameters:`, queryParams);

    try {
      const results = await this.searchService.search(this.resourceType, queryParams);
      this.logger.debug(`Search completed for ${this.resourceType}. Found ${results.total || 0} total matches`);
      return results;
    } catch (error) {
      this.logger.error(`Search failed for ${this.resourceType}:`, {
        resourceType: this.resourceType,
        queryParams,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Retrieves a specific resource by its unique identifier.
   * 
   * @param id - The unique identifier of the resource to retrieve
   * @returns Promise resolving to the resource data, or null if not found
   * 
   * @example
   * ```typescript
   * const patient = await service.findById('patient-123');
   * if (patient) {
   *   this.logger.log(`Found patient: ${patient.name[0].family}`);
   * }
   * ```
   */
  async findById(id: string, options?: CreateOrUpdateOptions): Promise<any> {
    this.logger.debug(`Retrieving ${this.resourceType} with ID: ${id}`);

    try {
      const manager = options?.manager || this.dataSource.manager;
      const repository = manager.getRepository(this.currentRepo.target);
      const existingEntity = await repository.findOneBy({ id } as any);

      if (!existingEntity) {
        this.logger.debug(`${this.resourceType} with ID ${id} not found`);
        return null;
      }

      this.logger.debug(`Successfully retrieved ${this.resourceType} with ID: ${id}`);
      return (existingEntity as any).resource;
    } catch (error) {
      this.logger.error(`Failed to retrieve ${this.resourceType} with ID ${id}:`, {
        resourceType: this.resourceType,
        resourceId: id,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Creates a new FHIR resource with automatic versioning and history tracking.
   * 
   * This method:
   * 1. Generates a new UUID for the resource
   * 2. Sets initial version metadata (version 1)
   * 3. Creates entries in both current and history tables
   * 4. Performs all operations within a database transaction
   * 
   * @param resource - The FHIR resource data to create (without id and meta fields)
   * @param options - Optional configuration for transactional control
   * @param options.id - Pre-defined ID to use instead of generating a new UUID
   * @param options.txid - Transaction ID for linking related operations
   * @param options.manager - EntityManager for participating in an existing transaction
   * @returns Promise resolving to the created resource with populated metadata
   * 
   * @throws {Error} When database transaction fails or validation errors occur
   * 
   * @example
   * ```typescript
   * const newPatient = await service.create({
   *   resourceType: 'Patient',
   *   name: [{ family: 'Doe', given: ['John'] }],
   *   gender: 'male'
   * });
   * this.logger.log(`Created patient with ID: ${newPatient.id}`);
   * ```
   */
  async create(resource: any, options?: CreateOrUpdateOptions): Promise<any> {
    const resourceId = options?.id || uuidv4();
    const transactionId = options?.txid || uuidv4();
    const versionId = 1;
    const lastUpdated = new Date();

    this.logger.log(`Creating new ${this.resourceType} with ID: ${resourceId}`);
    this.logger.debug(`Create operation details:`, {
      resourceType: this.resourceType,
      resourceId,
      transactionId,
      hasCustomId: !!options?.id,
      hasTransactionManager: !!options?.manager
    });

    // --- BEGIN: Check for unresolved urn:uuid references before saving ---
    function findUnresolvedReferences(obj: any, path = 'root', found: string[] = []): string[] {
      if (!obj || typeof obj !== 'object') return found;
      if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
          findUnresolvedReferences(obj[i], `${path}[${i}]`, found);
        }
      } else {
        for (const [key, value] of Object.entries(obj)) {
          if (key === 'reference' && typeof value === 'string' && value.startsWith('urn:uuid:')) {
            found.push(`${path}.${key}: ${value}`);
          } else if (typeof value === 'object' && value !== null) {
            findUnresolvedReferences(value, `${path}.${key}`, found);
          }
        }
      }
      return found;
    }
    const unresolvedRefs = findUnresolvedReferences(resource);
    if (unresolvedRefs.length > 0) {
      this.logger.warn(`Unresolved urn:uuid references found in resource just before DB save:`, {
        resourceType: this.resourceType,
        id: resourceId,
        unresolvedRefs,
        resource: JSON.stringify(resource)
      });
    } else {
      this.logger.debug(`No unresolved urn:uuid references in resource before DB save.`, {
        resourceType: this.resourceType,
        id: resourceId
      });
    }
    // --- END: Check for unresolved urn:uuid references before saving ---

    try {
      // Construct resource with FHIR metadata
      const resourceWithMeta = {
        ...resource,
        id: resourceId,
        resourceType: this.resourceType,
        meta: {
          versionId: '1',
          lastUpdated: lastUpdated.toISOString()
        },
      };

      // Create database entities
      const currentEntity = this.currentRepo.create({
        id: resourceId,
        versionId,
        lastUpdated,
        txid: transactionId,
        resource: resourceWithMeta
      } as any);

      const historyEntity = this.historyRepo.create({
        id: resourceId,
        versionId,
        lastUpdated,
        txid: transactionId,
        resource: resourceWithMeta
      } as any);

      // Execute within transaction
      if (options?.manager) {
        // Use provided transaction manager (already in a transaction)
        await options.manager.save(currentEntity);
        await options.manager.save(historyEntity);
      } else {
        // Create new transaction
        await this.dataSource.transaction(async (transactionManager) => {
          await transactionManager.save(currentEntity);
          await transactionManager.save(historyEntity);
        });
      }

      this.logger.log(`Successfully created ${this.resourceType} with ID: ${resourceId}, version: ${versionId}`);
      return resourceWithMeta;

    } catch (error) {
      this.logger.error(`Failed to create ${this.resourceType}:`, {
        resourceId,
        transactionId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Updates an existing FHIR resource with optimistic concurrency control.
   * 
   * This method implements FHIR's update semantics:
   * 1. If resource exists: Updates with version increment and conflict detection
   * 2. If resource doesn't exist: Creates as new resource with specified ID (PUT semantics)
   * 3. Validates version conflicts using If-Match headers/meta.versionId
   * 4. Maintains complete audit trail in history table
   * 
   * @param id - The unique identifier of the resource to update
   * @param resource - The updated resource data
   * @returns Promise resolving to the updated resource with new version metadata
   * 
   * @throws {ConflictException} When version conflict is detected
   * @throws {Error} When database transaction fails
   * 
   * @example
   * ```typescript
   * // Update existing patient
   * const updatedPatient = await service.update('patient-123', {
   *   resourceType: 'Patient',
   *   id: 'patient-123',
   *   name: [{ family: 'Smith', given: ['Jane'] }],
   *   meta: { versionId: '2' } // For optimistic locking
   * });
   * ```
   */
  async update(id: string, resource: any, options?: CreateOrUpdateOptions): Promise<any> {
    this.logger.log(`Updating ${this.resourceType} with ID: ${id}`);

    try {
      const existingEntity = await this.currentRepo.findOneBy({ id } as any);

      // Handle PUT-as-CREATE scenario (FHIR specification)
      if (!existingEntity) {
        this.logger.debug(`${this.resourceType} with ID ${id} not found, creating as new resource`);
        return this.createAsUpdate(id, resource, options);
      }

      // Version conflict detection (optimistic concurrency control)
      const currentVersion = (existingEntity as any).versionId;
      const clientVersion = resource.meta?.versionId;

      if (clientVersion && parseInt(clientVersion) !== currentVersion) {
        const conflictMessage = `Version conflict detected for ${this.resourceType} ${id}: client version "${clientVersion}" does not match server version "${currentVersion}"`;
        this.logger.warn(conflictMessage);
        throw new ConflictException(conflictMessage);
      }

      // Prepare update with version increment
      const newVersion = currentVersion + 1;
      const lastUpdated = new Date();
      const txid = options?.txid || uuidv4();

      this.logger.debug(`Updating ${this.resourceType} ${id} from version ${currentVersion} to ${newVersion}`);

      const resourceWithMeta = {
        ...resource,
        id,
        resourceType: this.resourceType,
        meta: {
          ...resource.meta,
          versionId: newVersion.toString(),
          lastUpdated: lastUpdated.toISOString()
        },
      };

      // Create updated entities
      const updatedEntity = this.currentRepo.create({
        ...existingEntity,
        versionId: newVersion,
        lastUpdated,
        txid,
        resource: resourceWithMeta
      } as any);

      const historyEntity = this.historyRepo.create({
        id,
        versionId: newVersion,
        lastUpdated,
        txid,
        resource: resourceWithMeta
      } as any);

      // Execute within transaction
      if (options?.manager) {
        // Use provided transaction manager (already in a transaction)
        await options.manager.save(updatedEntity);
        await options.manager.save(historyEntity);
      } else {
        // Create new transaction
        await this.dataSource.transaction(async (manager) => {
          await manager.save(updatedEntity);
          await manager.save(historyEntity);
        });
      }

      this.logger.log(`Successfully updated ${this.resourceType} ${id} to version ${newVersion}`);
      return resourceWithMeta;

    } catch (error) {
      if (error instanceof ConflictException) {
        throw error; // Re-throw conflict exceptions as-is
      }

      this.logger.error(`Failed to update ${this.resourceType} with ID ${id}:`, {
        resourceId: id,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Applies JSON Patch operations to modify an existing FHIR resource.
   * 
   * Implements RFC 6902 JSON Patch specification for partial resource updates.
   * This method retrieves the current resource, applies the patch operations,
   * and then performs a full update with the modified resource.
   * 
   * @param id - The unique identifier of the resource to patch
   * @param patch - Array of JSON Patch operations to apply
   * @returns Promise resolving to the patched resource with updated metadata
   * 
   * @throws {NotFoundException} When the resource to patch doesn't exist
   * @throws {Error} When patch operations are invalid or cannot be applied
   * 
   * @example
   * ```typescript
   * // Add a new phone number to a patient
   * const patchedPatient = await service.patch('patient-123', [
   *   {
   *     op: 'add',
   *     path: '/telecom/-',
   *     value: { system: 'phone', value: '+1-555-0123' }
   *   }
   * ]);
   * ```
   * 
   * @see {@link https://tools.ietf.org/html/rfc6902} RFC 6902 JSON Patch
   */
  async patch(id: string, patch: jsonpatch.Operation[]): Promise<any> {
    this.logger.log(`Applying JSON Patch to ${this.resourceType} with ID: ${id}`);
    this.logger.debug(`Patch operations:`, patch);

    try {
      const existingEntity = await this.currentRepo.findOneBy({ id } as any);

      if (!existingEntity) {
        const notFoundMessage = `${this.resourceType} with ID ${id} not found for patch operation`;
        this.logger.warn(notFoundMessage);
        throw new NotFoundException(notFoundMessage);
      }

      const existingResource = (existingEntity as any).resource;
      this.logger.debug(`Applying ${patch.length} patch operation(s) to ${this.resourceType} ${id}`);

      // Apply patch operations with validation
      const patchResult = jsonpatch.applyPatch(existingResource, patch, true, false);
      const patchedResourceDocument = patchResult.newDocument;

      this.logger.debug(`Patch operations applied successfully. Proceeding with update.`);

      // Perform update with patched resource
      const result = await this.update(id, patchedResourceDocument);

      this.logger.log(`Successfully patched ${this.resourceType} ${id}`);
      return result;

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error; // Re-throw not found exceptions as-is
      }

      this.logger.error(`Failed to patch ${this.resourceType} with ID ${id}:`, {
        resourceId: id,
        patchOperationsCount: patch.length,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Creates a new resource with a predefined ID (PUT-as-CREATE operation).
   * 
   * This private method handles the FHIR specification requirement that PUT operations
   * on non-existent resources should create them with the specified ID. This differs
   * from standard POST creation where IDs are auto-generated.
   * 
   * @private
   * @param id - The predefined ID for the new resource
   * @param resource - The resource data to create
   * @returns Promise resolving to the created resource with metadata
   * 
   * @throws {Error} When database transaction fails
   */
  private async createAsUpdate(id: string, resource: any, options?: CreateOrUpdateOptions): Promise<any> {
    this.logger.debug(`Creating ${this.resourceType} as update with predefined ID: ${id}`);

    const versionId = 1;
    const lastUpdated = new Date();
    const txid = options?.txid || uuidv4();

    try {
      const resourceWithMeta = {
        ...resource,
        resourceType: this.resourceType,
        id,
        meta: {
          versionId: '1',
          lastUpdated: lastUpdated.toISOString()
        }
      };

      const currentEntity = this.currentRepo.create({
        id,
        versionId,
        lastUpdated,
        txid,
        resource: resourceWithMeta
      } as any);

      const historyEntity = this.historyRepo.create({
        id,
        versionId,
        lastUpdated,
        txid,
        resource: resourceWithMeta
      } as any);

      // Execute within transaction
      if (options?.manager) {
        // Use provided transaction manager (already in a transaction)
        await options.manager.save(currentEntity);
        await options.manager.save(historyEntity);
      } else {
        // Create new transaction
        await this.dataSource.transaction(async (manager) => {
          await manager.save(currentEntity);
          await manager.save(historyEntity);
        });
      }

      this.logger.log(`Successfully created ${this.resourceType} ${id} via PUT-as-CREATE`);
      return resourceWithMeta;

    } catch (error) {
      this.logger.error(`Failed to create ${this.resourceType} as update with ID ${id}:`, {
        resourceId: id,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Deletes a resource by its ID.
   * 
   * This operation permanently removes the resource from the current table but preserves
   * its history for audit purposes. The deletion is performed within a database transaction
   * to ensure consistency.
   * 
   * @param id - The unique identifier of the resource to delete
   * @param options - Optional transactional controls including EntityManager and transaction ID
   * @returns Promise<void> - Resolves when the resource is successfully deleted
   * 
   * @throws {NotFoundException} When the resource with the specified ID is not found
   * @throws {Error} For database errors or other deletion failures
   * 
   * @example
   * ```typescript
   * // Delete a patient resource
   * await patientService.delete('patient-123');
   * 
   * // Delete within a transaction
   * await patientService.delete('patient-123', { 
   *   txid: 'txn-456',
   *   manager: transactionManager 
   * });
   * ```
   */
  async delete(id: string, options?: CreateOrUpdateOptions): Promise<void> {
    this.logger.log(`Deleting ${this.resourceType} with ID: ${id}`, {
      resourceId: id,
      txid: options?.txid
    });

    try {
      // Find the existing resource first to verify it exists
      const existingResource = await this.findById(id, options);
      if (!existingResource) {
        throw new NotFoundException(`${this.resourceType}/${id} not found`);
      }

      // Perform the deletion within a transaction
      const manager = options?.manager || this.dataSource.manager;

      await manager.transaction(async (transactionManager) => {
        // Delete from the current table
        await transactionManager.delete(this.currentRepo.target, { id });

        this.logger.log(`Successfully deleted ${this.resourceType} ${id}`, {
          resourceId: id,
          txid: options?.txid
        });
      });

    } catch (error) {
      if (error instanceof NotFoundException) {
        // Re-throw NotFoundException as-is
        throw error;
      }

      this.logger.error(`Failed to delete ${this.resourceType} with ID ${id}:`, {
        resourceId: id,
        error: error.message,
        stack: error.stack,
        txid: options?.txid
      });
      throw error;
    }
  }
}
