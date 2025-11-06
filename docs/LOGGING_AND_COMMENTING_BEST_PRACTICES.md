# Logging and Commenting Best Practices

This document outlines the logging and commenting standards for the FHIR Service application to ensure maintainability, debuggability, and professional code quality.

## Table of Contents
- [Logging Standards](#logging-standards)
- [Comment Standards](#comment-standards)
- [Examples](#examples)
- [Tools and Configuration](#tools-and-configuration)

## Logging Standards

### Logging Levels

Use NestJS Logger with appropriate levels:

```typescript
import { Logger } from '@nestjs/common';

export class MyService {
  private readonly logger = new Logger(MyService.name);
  
  // Log levels in order of severity:
  this.logger.error()   // 🔴 System errors, exceptions, failures
  this.logger.warn()    // 🟡 Warnings, deprecated usage, recoverable issues  
  this.logger.log()     // 🟢 Important business events, lifecycle events
  this.logger.debug()   // 🔵 Detailed flow information, parameter values
  this.logger.verbose() // ⚪ Very detailed tracing (rarely used)
}
```

### When to Log Each Level

#### ERROR Level 🔴
- Database connection failures
- Unhandled exceptions
- Data validation failures  
- External service failures
- Security violations

```typescript
try {
  await this.repository.save(entity);
} catch (error) {
  this.logger.error(`Failed to save ${this.resourceType}:`, {
    resourceId: id,
    error: error.message,
    stack: error.stack
  });
  throw error;
}
```

#### WARN Level 🟡
- Version conflicts (handled gracefully)
- Deprecated API usage
- Configuration issues (with fallbacks)
- Resource not found (expected scenarios)

```typescript
if (clientVersion && parseInt(clientVersion) !== currentVersion) {
  const message = `Version conflict for ${this.resourceType} ${id}: client="${clientVersion}" server="${currentVersion}"`;
  this.logger.warn(message);
  throw new ConflictException(message);
}
```

#### LOG Level 🟢
- Resource lifecycle events (create, update, delete)
- Service initialization
- Important business operations
- API endpoint calls (major operations)

```typescript
this.logger.log(`Creating new ${this.resourceType} with ID: ${resourceId}`);
this.logger.log(`Successfully updated ${this.resourceType} ${id} to version ${newVersion}`);
this.logger.log('Patient service initialized successfully');
```

#### DEBUG Level 🔵
- Method entry/exit with parameters
- Search operations with criteria
- Internal state changes
- Performance metrics

```typescript
this.logger.debug(`Searching ${this.resourceType} resources with parameters:`, queryParams);
this.logger.debug(`Applying ${patch.length} patch operation(s) to ${this.resourceType} ${id}`);
this.logger.debug(`Found ${results.total || 0} total matches`);
```

### Structured Logging

Always use structured logging for complex data:

```typescript
// ✅ Good - Structured with context
this.logger.debug(`Create operation details:`, {
  resourceType: this.resourceType,
  resourceId,
  transactionId,
  hasCustomId: !!options?.id,
  hasTransactionManager: !!options?.manager
});

// ❌ Bad - Unstructured string concatenation
this.logger.debug(`Creating ${this.resourceType} with ID ${resourceId} and txid ${transactionId}`);
```

### Security Considerations

Never log sensitive information:

```typescript
// ✅ Good - Log IDs and metadata only
this.logger.log(`User authentication successful`, { userId: user.id, roles: user.roles });

// ❌ Bad - Logs sensitive data
this.logger.log(`User login:`, { username, password, ssn: user.ssn });
```

## Comment Standards

### Class-Level Documentation

Every class should have comprehensive JSDoc comments:

```typescript
/**
 * Concrete service implementation for managing FHIR Patient resources.
 * 
 * This service extends the GenericFhirService to provide Patient-specific functionality
 * while inheriting all standard FHIR operations (create, read, update, delete, search, patch).
 * 
 * The service automatically handles:
 * - Patient resource lifecycle management
 * - Version control and optimistic concurrency
 * - Audit trail maintenance in patient_history table
 * - Integration with FHIR search parameters
 * - Transaction support for bundle operations
 * 
 * @example
 * ```typescript
 * const patient = await this.patientService.create({
 *   resourceType: 'Patient',
 *   name: [{ family: 'Doe', given: ['John'] }],
 *   gender: 'male'
 * });
 * ```
 * 
 * @see {@link GenericFhirService} For inherited CRUD operations
 * @see {@link https://www.hl7.org/fhir/patient.html} FHIR Patient Resource Specification
 */
@Injectable()
export class PatientService extends GenericFhirService<Patient, PatientHistory> {
```

### Method Documentation

Document all public methods with complete JSDoc:

```typescript
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
 * ```
 */
async create(resource: any, options?: CreateOrUpdateOptions): Promise<any> {
```

### Inline Comments

Use inline comments to explain complex business logic:

```typescript
// Handle PUT-as-CREATE scenario (FHIR specification requirement)
if (!existingEntity) {
  this.logger.debug(`${this.resourceType} with ID ${id} not found, creating as new resource`);
  return this.createAsUpdate(id, resource);
}

// Version conflict detection (optimistic concurrency control)
const currentVersion = (existingEntity as any).version_id;
const clientVersion = resource.meta?.versionId;
```

### Comment Quality Guidelines

#### ✅ Good Comments
- Explain **why**, not **what**
- Provide context and business rules
- Reference specifications and standards
- Include examples for complex operations

#### ❌ Bad Comments
```typescript
// Bad - States the obvious
let count = 0; // Initialize count to zero

// Bad - Outdated information
// TODO: Fix this bug (from 2019)

// Bad - Commented-out code
// const oldMethod = () => { ... }
```

## Examples

### Service Class Example

```typescript
/**
 * Service for managing FHIR Observation resources with specialized vital signs handling.
 * 
 * Extends the base FHIR service to provide Observation-specific functionality including
 * vital signs categorization, reference range validation, and clinical decision support
 * integration. Automatically maintains audit trails and supports real-time monitoring alerts.
 * 
 * @see {@link https://www.hl7.org/fhir/observation.html} FHIR Observation Resource
 */
@Injectable()
export class ObservationService extends GenericFhirService<Observation, ObservationHistory> {
  private readonly logger = new Logger(ObservationService.name);
  protected readonly resourceType = 'Observation';

  constructor(
    @InjectRepository(Observation) protected readonly repo: Repository<Observation>,
    @InjectRepository(ObservationHistory) protected readonly historyRepo: Repository<ObservationHistory>,
    protected readonly dataSource: DataSource,
    protected readonly searchService: GenericSearchService,
  ) {
    super(dataSource, searchService);
    this.currentRepo = repo;
    this.historyRepo = historyRepo;
    this.logger.log('Observation service initialized with vital signs monitoring');
  }

  /**
   * Creates a new vital signs observation with automatic clinical range validation.
   * 
   * @param vitalSigns - The vital signs data including type, value, and patient reference
   * @param options - Transaction options for bundle operations
   * @returns Promise resolving to created observation with clinical interpretation
   * 
   * @throws {ValidationException} When vital signs are outside acceptable ranges
   */
  async createVitalSigns(vitalSigns: VitalSignsData, options?: CreateOrUpdateOptions): Promise<any> {
    this.logger.log(`Creating vital signs observation for patient: ${vitalSigns.subject.reference}`);
    
    try {
      // Validate clinical ranges before creation
      await this.validateClinicalRanges(vitalSigns);
      
      const observation = await this.create(vitalSigns, options);
      this.logger.log(`Vital signs observation created successfully: ${observation.id}`);
      
      return observation;
    } catch (error) {
      this.logger.error(`Failed to create vital signs observation:`, {
        patientRef: vitalSigns.subject.reference,
        vitalType: vitalSigns.code.coding[0].code,
        error: error.message
      });
      throw error;
    }
  }
}
```

### Error Handling Example

```typescript
async processTransactionBundle(bundle: BundleDto): Promise<TransactionResponse> {
  const txid = uuidv4();
  this.logger.log(`Starting transaction bundle processing with ID: ${txid}`);
  
  try {
    const result = await this.dataSource.transaction(async (manager) => {
      this.logger.debug(`Processing ${bundle.entry.length} bundle entries`);
      
      // Process each entry...
      for (const [index, entry] of bundle.entry.entries()) {
        this.logger.debug(`Processing bundle entry ${index + 1}/${bundle.entry.length}`, {
          resourceType: entry.resource?.resourceType,
          operation: entry.request?.method
        });
        
        // Handle operation...
      }
      
      return responseBundle;
    });
    
    this.logger.log(`Transaction bundle completed successfully: ${txid}`);
    return result;
    
  } catch (error) {
    this.logger.error(`Transaction bundle failed: ${txid}`, {
      bundleId: bundle.id,
      entryCount: bundle.entry.length,
      error: error.message,
      stack: error.stack
    });
    
    throw new TransactionException(`Bundle processing failed: ${error.message}`, { txid });
  }
}
```

## Tools and Configuration

### NestJS Logger Configuration

Configure logging in `main.ts`:

```typescript
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'] // Adjust levels for environment
  });
  
  // Set global logger
  app.useLogger(app.get(Logger));
  
  await app.listen(3000);
}
```

### Environment-Based Logging

```typescript
// Development: All levels
const logLevels = ['error', 'warn', 'log', 'debug', 'verbose'];

// Production: Essential levels only  
const logLevels = ['error', 'warn', 'log'];

// Test: Minimal logging
const logLevels = ['error'];
```

### IDE Integration

Configure VSCode for JSDoc support:

```json
// .vscode/settings.json
{
  "typescript.suggest.jsdoc.generateReturns": true,
  "typescript.suggest.includeAutomaticOptionalChainCompletions": true,
  "typescript.preferences.includeDocumentationComments": true
}
```

### VS Code Snippets

The project includes custom snippets to streamline development:

- `fhir-service` - Creates a complete FHIR service class with proper documentation
- `fhir-controller` - Creates a FHIR controller with standard patterns
- `jsdoc-method` - Generates comprehensive method documentation template
- `log-structured` - Creates structured logging statements

Access these snippets by typing the prefix and pressing Tab in VS Code.

## Checklist

Before submitting code, ensure:

- [ ] All public methods have JSDoc documentation
- [ ] Error scenarios are logged appropriately  
- [ ] Sensitive data is not logged
- [ ] Log levels are used correctly
- [ ] Comments explain **why**, not **what**
- [ ] Examples are provided for complex operations
- [ ] External references (RFCs, FHIR specs) are included
- [ ] TODO comments have assignees and dates

---

*This document should be regularly updated as the codebase evolves and new patterns emerge.*
