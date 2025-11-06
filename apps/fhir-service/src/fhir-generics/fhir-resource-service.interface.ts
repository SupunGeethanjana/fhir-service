import { EntityManager } from 'typeorm';

/**
 * Defines the options for create/update operations, allowing for
 * transactional control from an orchestrator like the TransactionService.
 */
export interface CreateOrUpdateOptions {
  id?: string;
  txid?: string;
  manager?: EntityManager;
}

/**
 * This interface defines the essential contract that EVERY FHIR resource service
 * in our application MUST adhere to.
 * 
 * By implementing this, each service promises to have these methods, allowing
 * the TransactionService to interact with them in a type-safe way.
 */
export interface FhirResourceService {
  /**
   * Creates a new resource.
   * @param resource The FHIR resource data.
   * @param options Optional transactional controls.
   */
  create(resource: any, options?: CreateOrUpdateOptions): Promise<any>;

  /**
   * Updates an existing resource.
   * @param id The ID of the resource to update.
   * @param resource The new version of the resource.
   * @param options Optional transactional controls.
   */
  update(id: string, resource: any, options?: CreateOrUpdateOptions): Promise<any>;

  /**
   * Finds a resource by its ID.
   * @param id The ID of the resource to find.
   * @param options Optional transactional controls.
   */
  findById(id: string, options?: CreateOrUpdateOptions): Promise<any>;

  /**
   * Deletes a resource by its ID.
   * @param id The ID of the resource to delete.
   * @param options Optional transactional controls.
   */
  delete(id: string, options?: CreateOrUpdateOptions): Promise<void>;

  // You could add other required methods here, like patch(), etc.
}