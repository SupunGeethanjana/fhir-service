import { BadRequestException, Body, Get, Headers, HttpCode, HttpStatus, Logger, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiHeader, ApiOperation, ApiParam, ApiProduces, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Operation } from 'fast-json-patch';
import * as qs from 'qs';
import { BaseFhirResourceDto } from '../common/dtos/base-fhir-resource.dto';
import {
    ContentType,
    FhirBundleType,
    HttpStatusCode
} from '../common/enums/fhir-enums';
import { GenericFhirService } from './generic-fhir.service';

/**
 * Abstract base controller for all FHIR resource operations.
 * 
 * This class provides a generic implementation of standard FHIR REST operations:
 * - CREATE: POST /[resourceType] - Creates a new resource
 * - READ: GET /[resourceType]/[id] - Retrieves a specific resource
 * - UPDATE: PUT /[resourceType]/[id] - Updates an existing resource
 * - PATCH: PATCH /[resourceType]/[id] - Partially updates a resource using JSON Patch
 * - SEARCH: GET /[resourceType] or POST /[resourceType]/_search - Searches for resources
 * 
 * Resource-specific controllers should extend this class to inherit all FHIR operations
 * while only needing to provide the specific service implementation.
 * 
 * @template T - The entity type representing the current version of the resource
 * @template H - The entity type representing the historical versions of the resource
 * 
 * @abstract
 * @class GenericFhirController
 * @example
 * ```typescript
 * @Controller('Patient')
 * @ApiTags('Patient')
 * export class PatientController extends GenericFhirController<Patient, PatientHistory> {
 *   constructor(patientService: PatientService) {
 *     super(patientService);
 *   }
 * }
 * ```
 */
@ApiTags('FHIR Resources')
@ApiProduces(ContentType.APPLICATION_FHIR_JSON, ContentType.APPLICATION_JSON)
export abstract class GenericFhirController<T, H> {
    /** Logger instance for tracking operations and debugging */
    protected readonly logger = new Logger(GenericFhirController.name);

    /**
     * Creates an instance of GenericFhirController.
     * 
     * @param service - The FHIR service instance that handles business logic
     */
    constructor(protected readonly service: GenericFhirService<T, H>) {
        this.logger.log('Generic FHIR controller initialized');
    }

    /**
     * Creates a new FHIR resource.
     * 
     * Implements the FHIR CREATE operation as defined in the FHIR specification.
     * The server assigns a new logical ID and version to the resource.
     * 
     * @param createResourceDto - The FHIR resource data to create
     * @returns Promise<T> - The created resource with server-assigned ID and metadata
     * 
     * @example
     * POST /Patient
     * Content-Type: application/fhir+json
     * {
     *   "resourceType": "Patient",
     *   "name": [{"family": "Doe", "given": ["John"]}]
     * }
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Create a new FHIR resource',
        description: 'Creates a new FHIR resource. The server will assign a logical ID and version to the resource.',
        operationId: 'createResource'
    })
    @ApiConsumes(ContentType.APPLICATION_FHIR_JSON, ContentType.APPLICATION_JSON)
    @ApiBody({
        description: 'FHIR resource to create',
        type: BaseFhirResourceDto,
        examples: {
            patient: {
                summary: 'Patient resource example',
                value: {
                    resourceType: 'Patient',
                    name: [{ family: 'Doe', given: ['John'] }],
                    gender: 'male',
                    birthDate: '1990-01-01'
                }
            }
        }
    })
    @ApiResponse({
        status: HttpStatusCode.CREATED,
        description: 'Resource created successfully',
        schema: {
            type: 'object',
            properties: {
                resourceType: { type: 'string', example: 'Patient' },
                id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
                meta: {
                    type: 'object',
                    properties: {
                        versionId: { type: 'string', example: '1' },
                        lastUpdated: { type: 'string', format: 'date-time' }
                    }
                }
            }
        }
    })
    @ApiResponse({ status: HttpStatusCode.BAD_REQUEST, description: 'Invalid resource data' })
    @ApiResponse({ status: HttpStatusCode.UNPROCESSABLE_ENTITY, description: 'Unprocessable entity - validation errors' })
    @ApiResponse({ status: HttpStatusCode.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
    async create(@Body() createResourceDto: BaseFhirResourceDto) {
        const startTime = Date.now();
        this.logger.log(`Creating new resource of type: ${createResourceDto.resourceType}`);

        try {
            // Delegate to service layer for business logic and persistence
            const result = await this.service.create(createResourceDto);
            const duration = Date.now() - startTime;

            // Log successful creation with performance metrics
            this.logger.log(`Resource created successfully - ID: ${result.id}, Duration: ${duration}ms`);
            this.logger.debug(`Created resource details: ${JSON.stringify(result)}`);

            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            // Log error with context for debugging
            this.logger.error(
                `Failed to create resource - Type: ${createResourceDto.resourceType}, Duration: ${duration}ms, Error: ${error.message}`,
                error.stack
            );
            throw error;
        }
    }

    /**
     * Searches for FHIR resources using GET method with query parameters.
     * 
     * Implements the FHIR SEARCH operation using URL query parameters.
     * Supports all standard FHIR search parameters like _id, _lastUpdated, etc.
     * 
     * @param query - Query parameters for filtering resources
     * @returns Promise<any> - FHIR Bundle containing matching resources
     * 
     * @example
     * GET /Patient?family=Doe&given=John&_sort=family
     */
    @Get()
    @ApiOperation({
        summary: 'Search FHIR resources',
        description: 'Search for FHIR resources using query parameters. Supports all standard FHIR search parameters.',
        operationId: 'searchResources'
    })
    @ApiQuery({ name: '_id', required: false, description: 'Logical ID of the resource', type: 'string' })
    @ApiQuery({ name: '_lastUpdated', required: false, description: 'Last update date range', type: 'string' })
    @ApiQuery({ name: '_count', required: false, description: 'Number of results to return', type: 'number' })
    @ApiQuery({ name: '_sort', required: false, description: 'Sort order', type: 'string' })
    @ApiQuery({ name: '_include', required: false, description: 'Include related resources', type: 'string' })
    @ApiQuery({ name: '_revinclude', required: false, description: 'Reverse include related resources', type: 'string' })
    @ApiResponse({
        status: HttpStatusCode.OK,
        description: 'Search results',
        schema: {
            type: 'object',
            properties: {
                resourceType: { type: 'string', example: 'Bundle' },
                type: { type: 'string', example: FhirBundleType.SEARCHSET },
                total: { type: 'number', example: 10 },
                entry: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            resource: { type: 'object', description: 'FHIR resource' },
                            search: { type: 'object', properties: { mode: { type: 'string', example: 'match' } } }
                        }
                    }
                }
            }
        }
    })
    @ApiResponse({ status: HttpStatusCode.BAD_REQUEST, description: 'Invalid search parameters' })
    @ApiResponse({ status: HttpStatusCode.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
    async searchByGet(@Query() query: any) {
        const startTime = Date.now();
        const queryString = JSON.stringify(query);
        this.logger.log(`Performing GET search with query: ${queryString}`);

        try {
            // Execute search through service layer
            const result = await this.service.search(query);
            const duration = Date.now() - startTime;
            const resultCount = result?.entry?.length || 0;

            // Log search results with performance metrics
            this.logger.log(`Search completed - Results: ${resultCount}, Duration: ${duration}ms`);
            this.logger.debug(`Search query parameters: ${queryString}`);

            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            // Log search failure with context
            this.logger.error(
                `Search failed - Query: ${queryString}, Duration: ${duration}ms, Error: ${error.message}`,
                error.stack
            );
            throw error;
        }
    }

    /**
     * Searches for FHIR resources using POST method with request body.
     * 
     * Implements the FHIR SEARCH operation using POST to handle complex queries
     * that might exceed URL length limits or require form-encoded parameters.
     * 
     * @param body - Search parameters in request body (JSON or form-encoded)
     * @param contentType - Content-Type header to determine parsing strategy
     * @returns Promise<any> - FHIR Bundle containing matching resources
     * 
     * @example
     * POST /Patient/_search
     * Content-Type: application/x-www-form-urlencoded
     * family=Doe&given=John&_sort=family
     */
    @Post('_search')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Search FHIR resources via POST',
        description: 'Search for FHIR resources using POST method. Useful for complex queries that exceed URL length limits.',
        operationId: 'searchResourcesPost'
    })
    @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
    @ApiHeader({
        name: 'content-type',
        description: 'Content type of the request body',
        required: true,
        schema: {
            type: 'string',
            enum: ['application/x-www-form-urlencoded', 'application/json']
        }
    })
    @ApiBody({
        description: 'Search parameters',
        examples: {
            formEncoded: {
                summary: 'Form-encoded search parameters',
                value: 'family=Doe&given=John&_sort=family'
            },
            json: {
                summary: 'JSON search parameters',
                value: {
                    family: 'Doe',
                    given: 'John',
                    _sort: 'family'
                }
            }
        }
    })
    @ApiResponse({
        status: 200,
        description: 'Search results',
        schema: {
            type: 'object',
            properties: {
                resourceType: { type: 'string', example: 'Bundle' },
                type: { type: 'string', example: 'searchset' },
                total: { type: 'number' },
                entry: { type: 'array', items: { type: 'object' } }
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Invalid search parameters or content type' })
    @ApiResponse({ status: 500, description: 'Internal server error' })
    async searchByPost(@Body() body: any, @Headers('content-type') contentType: string) {
        const startTime = Date.now();
        this.logger.log(`Performing POST search with content-type: ${contentType}`);

        try {
            // Parse request body based on content type
            const queryParams = (contentType?.includes('application/x-www-form-urlencoded'))
                ? qs.parse(body) // Parse form-encoded data
                : body; // Use JSON data directly

            this.logger.debug(`Parsed search parameters: ${JSON.stringify(queryParams)}`);

            // Execute search with parsed parameters
            const result = await this.service.search(queryParams);
            const duration = Date.now() - startTime;
            const resultCount = result?.entry?.length || 0;

            // Log successful search with metrics
            this.logger.log(`POST search completed - Results: ${resultCount}, Duration: ${duration}ms`);

            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            // Log POST search failure
            this.logger.error(
                `POST search failed - Content-Type: ${contentType}, Duration: ${duration}ms, Error: ${error.message}`,
                error.stack
            );
            throw error;
        }
    }

    /**
     * Retrieves a specific FHIR resource by its logical ID.
     * 
     * Implements the FHIR READ operation to fetch a single resource instance.
     * Returns the current version of the resource or 404 if not found.
     * 
     * @param id - The logical ID of the resource to retrieve
     * @returns Promise<T | null> - The requested resource or null if not found
     * 
     * @example
     * GET /Patient/123
     */
    @Get(':id')
    @ApiOperation({
        summary: 'Read a FHIR resource by ID',
        description: 'Retrieves a specific FHIR resource by its logical ID. Returns the current version of the resource.',
        operationId: 'readResource'
    })
    @ApiParam({
        name: 'id',
        description: 'Logical ID of the FHIR resource',
        type: 'string',
        example: '123e4567-e89b-12d3-a456-426614174000'
    })
    @ApiResponse({
        status: 200,
        description: 'Resource found',
        schema: {
            type: 'object',
            properties: {
                resourceType: { type: 'string' },
                id: { type: 'string' },
                meta: {
                    type: 'object',
                    properties: {
                        versionId: { type: 'string' },
                        lastUpdated: { type: 'string', format: 'date-time' }
                    }
                }
            }
        }
    })
    @ApiResponse({ status: 404, description: 'Resource not found' })
    @ApiResponse({ status: 400, description: 'Invalid resource ID format' })
    @ApiResponse({ status: 500, description: 'Internal server error' })
    async findById(@Param('id') id: string) {
        const startTime = Date.now();
        this.logger.log(`Retrieving resource by ID: ${id}`);

        try {
            // Fetch resource by ID from service layer
            const result = await this.service.findById(id);
            const duration = Date.now() - startTime;

            if (result) {
                // Log successful retrieval with version info
                this.logger.log(`Resource found - ID: ${id}, Version: ${result.meta?.versionId || 'N/A'}, Duration: ${duration}ms`);
                this.logger.debug(`Retrieved resource: ${JSON.stringify(result)}`);
            } else {
                // Log when resource is not found
                this.logger.warn(`Resource not found - ID: ${id}, Duration: ${duration}ms`);
            }

            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            // Log retrieval failure
            this.logger.error(
                `Failed to retrieve resource - ID: ${id}, Duration: ${duration}ms, Error: ${error.message}`,
                error.stack
            );
            throw error;
        }
    }

    /**
     * Updates an existing FHIR resource with complete replacement.
     * 
     * Implements the FHIR UPDATE operation using PUT method.
     * Replaces the entire resource content and increments the version number.
     * Creates a new version in the resource history.
     * 
     * @param id - The logical ID of the resource to update
     * @param updateResourceDto - The complete updated resource data
     * @returns Promise<T> - The updated resource with new version metadata
     * 
     * @example
     * PUT /Patient/123
     * Content-Type: application/fhir+json
     * {
     *   "resourceType": "Patient",
     *   "id": "123",
     *   "name": [{"family": "Smith", "given": ["John"]}]
     * }
     */
    @Put(':id')
    @ApiOperation({
        summary: 'Update a FHIR resource',
        description: 'Updates an existing FHIR resource with complete replacement. Creates a new version in history.',
        operationId: 'updateResource'
    })
    @ApiConsumes('application/fhir+json', 'application/json')
    @ApiParam({
        name: 'id',
        description: 'Logical ID of the FHIR resource to update',
        type: 'string',
        example: '123e4567-e89b-12d3-a456-426614174000'
    })
    @ApiBody({
        description: 'Complete FHIR resource data for update',
        type: BaseFhirResourceDto,
        examples: {
            patient: {
                summary: 'Updated Patient resource',
                value: {
                    resourceType: 'Patient',
                    id: '123e4567-e89b-12d3-a456-426614174000',
                    name: [{ family: 'Smith', given: ['John', 'Michael'] }],
                    gender: 'male',
                    birthDate: '1990-01-01'
                }
            }
        }
    })
    @ApiResponse({
        status: 200,
        description: 'Resource updated successfully',
        schema: {
            type: 'object',
            properties: {
                resourceType: { type: 'string' },
                id: { type: 'string' },
                meta: {
                    type: 'object',
                    properties: {
                        versionId: { type: 'string', example: '2' },
                        lastUpdated: { type: 'string', format: 'date-time' }
                    }
                }
            }
        }
    })
    @ApiResponse({ status: 404, description: 'Resource not found' })
    @ApiResponse({ status: 400, description: 'Invalid resource data or ID mismatch' })
    @ApiResponse({ status: 422, description: 'Unprocessable entity - validation errors' })
    @ApiResponse({ status: 500, description: 'Internal server error' })
    async update(@Param('id') id: string, @Body() updateResourceDto: BaseFhirResourceDto) {
        const startTime = Date.now();
        this.logger.log(`Updating resource - ID: ${id}, Type: ${updateResourceDto.resourceType}`);

        try {
            // Perform full resource update through service
            const result = await this.service.update(id, updateResourceDto);
            const duration = Date.now() - startTime;

            // Log successful update with version tracking
            this.logger.log(`Resource updated successfully - ID: ${id}, New Version: ${result.meta?.versionId || 'N/A'}, Duration: ${duration}ms`);
            this.logger.debug(`Updated resource details: ${JSON.stringify(result)}`);

            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            // Log update failure with context
            this.logger.error(
                `Failed to update resource - ID: ${id}, Type: ${updateResourceDto.resourceType}, Duration: ${duration}ms, Error: ${error.message}`,
                error.stack
            );
            throw error;
        }
    }

    /**
     * Partially updates a FHIR resource using JSON Patch operations.
     * 
     * Implements the FHIR PATCH operation using RFC 6902 JSON Patch format.
     * Allows selective modifications without replacing the entire resource.
     * Creates a new version in the resource history.
     * 
     * @param id - The logical ID of the resource to patch
     * @param patchOperations - Array of JSON Patch operations to apply
     * @returns Promise<T> - The patched resource with new version metadata
     * 
     * @example
     * PATCH /Patient/123
     * Content-Type: application/json-patch+json
     * [
     *   {"op": "replace", "path": "/name/0/family", "value": "NewName"},
     *   {"op": "add", "path": "/telecom/-", "value": {"system": "email", "value": "john@example.com"}}
     * ]
     */
    @Patch(':id')
    @ApiOperation({
        summary: 'Patch a FHIR resource',
        description: 'Partially updates a FHIR resource using JSON Patch operations (RFC 6902). Creates a new version in history.',
        operationId: 'patchResource'
    })
    @ApiConsumes('application/json-patch+json', 'application/json')
    @ApiParam({
        name: 'id',
        description: 'Logical ID of the FHIR resource to patch',
        type: 'string',
        example: '123e4567-e89b-12d3-a456-426614174000'
    })
    @ApiBody({
        description: 'Array of JSON Patch operations',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    op: {
                        type: 'string',
                        enum: ['add', 'remove', 'replace', 'move', 'copy', 'test'],
                        description: 'The operation to perform'
                    },
                    path: {
                        type: 'string',
                        description: 'JSON Pointer path to the target location'
                    },
                    value: {
                        description: 'The value to use for the operation'
                    },
                    from: {
                        type: 'string',
                        description: 'Source path for move/copy operations'
                    }
                },
                required: ['op', 'path']
            }
        },
        examples: {
            updateName: {
                summary: 'Update patient name',
                value: [
                    { op: 'replace', path: '/name/0/family', value: 'NewLastName' }
                ]
            },
            addContact: {
                summary: 'Add contact information',
                value: [
                    { op: 'add', path: '/telecom/-', value: { system: 'email', value: 'john@example.com' } }
                ]
            },
            multipleOperations: {
                summary: 'Multiple operations',
                value: [
                    { op: 'replace', path: '/name/0/family', value: 'Smith' },
                    { op: 'add', path: '/telecom/-', value: { system: 'phone', value: '+1234567890' } },
                    { op: 'remove', path: '/name/0/prefix' }
                ]
            }
        }
    })
    @ApiResponse({
        status: 200,
        description: 'Resource patched successfully',
        schema: {
            type: 'object',
            properties: {
                resourceType: { type: 'string' },
                id: { type: 'string' },
                meta: {
                    type: 'object',
                    properties: {
                        versionId: { type: 'string', example: '3' },
                        lastUpdated: { type: 'string', format: 'date-time' }
                    }
                }
            }
        }
    })
    @ApiResponse({ status: 404, description: 'Resource not found' })
    @ApiResponse({ status: 400, description: 'Invalid patch operations format' })
    @ApiResponse({ status: 422, description: 'Patch operation failed - invalid path or value' })
    @ApiResponse({ status: 500, description: 'Internal server error' })
    async patch(@Param('id') id: string, @Body() patchOperations: Operation[]) {
        const startTime = Date.now();
        this.logger.log(`Patching resource - ID: ${id}, Operations: ${patchOperations?.length || 0}`);

        try {
            // Validate patch operations format
            if (!Array.isArray(patchOperations)) {
                this.logger.warn(`Invalid patch format for resource ID: ${id} - Expected array, got: ${typeof patchOperations}`);
                throw new BadRequestException('Invalid patch format. The body must be an array of JSON Patch operations.');
            }

            this.logger.debug(`Patch operations: ${JSON.stringify(patchOperations)}`);

            // Apply patch operations through service layer
            const result = await this.service.patch(id, patchOperations);
            const duration = Date.now() - startTime;

            // Log successful patch with version tracking
            this.logger.log(`Resource patched successfully - ID: ${id}, New Version: ${result.meta?.versionId || 'N/A'}, Duration: ${duration}ms`);
            this.logger.debug(`Patched resource details: ${JSON.stringify(result)}`);

            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            // Log patch failure with operation context
            this.logger.error(
                `Failed to patch resource - ID: ${id}, Operations: ${patchOperations?.length || 0}, Duration: ${duration}ms, Error: ${error.message}`,
                error.stack
            );
            throw error;
        }
    }
}