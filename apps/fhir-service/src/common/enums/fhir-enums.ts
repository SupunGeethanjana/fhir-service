/**
 * Comprehensive enums for the FHIR service to improve type safety and maintainability.
 * 
 * This file contains various enums used throughout the application to replace
 * string literals and provide better IntelliSense support.
 */

/**
 * HTTP status codes commonly used in FHIR operations.
 * 
 * @see https://www.hl7.org/fhir/http.html
 */
export enum HttpStatusCode {
    /** Request successful */
    OK = 200,
    /** Resource created successfully */
    CREATED = 201,
    /** Request successful, no content to return */
    NO_CONTENT = 204,
    /** Bad request - invalid parameters or malformed request */
    BAD_REQUEST = 400,
    /** Unauthorized - authentication required */
    UNAUTHORIZED = 401,
    /** Forbidden - access denied */
    FORBIDDEN = 403,
    /** Resource not found */
    NOT_FOUND = 404,
    /** Request timeout */
    REQUEST_TIMEOUT = 408,
    /** Conflict - resource version mismatch or duplicate */
    CONFLICT = 409,
    /** Precondition failed */
    PRECONDITION_FAILED = 412,
    /** Unprocessable entity - validation errors */
    UNPROCESSABLE_ENTITY = 422,
    /** Internal server error */
    INTERNAL_SERVER_ERROR = 500,
    /** Service unavailable */
    SERVICE_UNAVAILABLE = 503
}

/**
 * HTTP status descriptions for FHIR transaction responses.
 */
export enum HttpStatusDescription {
    OK = '200 OK',
    CREATED = '201 Created',
    NO_CONTENT = '204 No Content',
    BAD_REQUEST = '400 Bad Request',
    UNAUTHORIZED = '401 Unauthorized',
    FORBIDDEN = '403 Forbidden',
    NOT_FOUND = '404 Not Found',
    REQUEST_TIMEOUT = '408 Request Timeout',
    CONFLICT = '409 Conflict',
    PRECONDITION_FAILED = '412 Precondition Failed',
    UNPROCESSABLE_ENTITY = '422 Unprocessable Entity',
    INTERNAL_SERVER_ERROR = '500 Internal Server Error',
    SERVICE_UNAVAILABLE = '503 Service Unavailable'
}

/**
 * FHIR resource types supported by this service.
 * 
 * @see https://www.hl7.org/fhir/resourcelist.html
 */
export enum FhirResourceType {
    PATIENT = 'Patient',
    PRACTITIONER = 'Practitioner',
    PRACTITIONER_ROLE = 'PractitionerRole',
    IMMUNIZATION = 'Immunization',
    SLOT = 'Slot',
    SCHEDULE = 'Schedule',
    OBSERVATION = 'Observation',
    CONDITION = 'Condition',
    ENCOUNTER = 'Encounter',
    PROCEDURE = 'Procedure',
    DIAGNOSTIC_REPORT = 'DiagnosticReport',
    SERVICE_REQUEST = 'ServiceRequest',
    COMPOSITION = 'Composition',
    FAMILY_MEMBER_HISTORY = 'FamilyMemberHistory',
    ALLERGY_INTOLERANCE = 'AllergyIntolerance',
    APPOINTMENT = 'Appointment',
    MEDICATION_REQUEST = 'MedicationRequest',
    MEDICATION_STATEMENT = 'MedicationStatement',
    CARE_PLAN = 'CarePlan',
    BUNDLE = 'Bundle',
    ORGANIZATION = 'Organization',
    LOCATION = 'Location',
    MEDICATION = 'Medication',
    DEVICE = 'Device',
    SPECIMEN = 'Specimen',
    CODE_SYSTEM = 'CodeSystem',
    VALUE_SET = 'ValueSet',
    IMAGING_STUDY = 'ImagingStudy',
    MEDIA = 'Media',
    OPERATION_OUTCOME = 'OperationOutcome',
    CARE_TEAM = 'CareTeam',
    CLAIM = 'Claim',
    COVERAGE = 'Coverage',
    DOCUMENT_REFERENCE = 'DocumentReference',
    EXPLANATION_OF_BENEFIT = 'ExplanationOfBenefit',
    GOAL = 'Goal',
    MEDICATION_ADMINISTRATION = 'MedicationAdministration',
    PROVENANCE = 'Provenance'
}

/**
 * FHIR Bundle types as defined in the FHIR specification.
 * 
 * @see https://www.hl7.org/fhir/bundle.html#bundle-type
 */
export enum FhirBundleType {
    /** Document bundle for clinical documents */
    DOCUMENT = 'document',
    /** Message bundle for messaging */
    MESSAGE = 'message',
    /** Transaction bundle for atomic operations */
    TRANSACTION = 'transaction',
    /** Transaction response bundle */
    TRANSACTION_RESPONSE = 'transaction-response',
    /** Batch bundle for non-atomic operations */
    BATCH = 'batch',
    /** Batch response bundle */
    BATCH_RESPONSE = 'batch-response',
    /** History bundle for version history */
    HISTORY = 'history',
    /** Search results bundle */
    SEARCHSET = 'searchset',
    /** Collection bundle for grouping resources */
    COLLECTION = 'collection',
    /** Transaction response bundle (legacy) */
    TRANSACTION_RESPONSE_LEGACY = 'transaction-response'
}

/**
 * HTTP methods used in FHIR REST operations.
 */
export enum HttpMethod {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    PATCH = 'PATCH',
    DELETE = 'DELETE'
}

/**
 * Content types used in FHIR operations.
 * 
 * @see https://www.hl7.org/fhir/http.html#content-types
 */
export enum ContentType {
    /** Standard JSON content type */
    APPLICATION_JSON = 'application/json',
    /** FHIR-specific JSON content type */
    APPLICATION_FHIR_JSON = 'application/fhir+json',
    /** Form URL encoded content type */
    APPLICATION_FORM_URLENCODED = 'application/x-www-form-urlencoded',
    /** JSON Patch content type for PATCH operations */
    APPLICATION_JSON_PATCH = 'application/json-patch+json',
    /** Plain text content type */
    TEXT_PLAIN = 'text/plain'
}

/**
 * Database transaction isolation levels.
 */
export enum TransactionIsolation {
    READ_UNCOMMITTED = 'READ UNCOMMITTED',
    READ_COMMITTED = 'READ COMMITTED',
    REPEATABLE_READ = 'REPEATABLE READ',
    SERIALIZABLE = 'SERIALIZABLE'
}

/**
 * FHIR search parameter comparison prefixes as defined in the FHIR specification.
 * 
 * These prefixes are used in search queries to specify comparison operations,
 * particularly for date and number parameters.
 * 
 * @see https://www.hl7.org/fhir/search.html#prefix
 */
export enum FhirSearchPrefix {
    /** Equal (default) */
    EQ = 'eq',
    /** Not equal */
    NE = 'ne',
    /** Greater than */
    GT = 'gt',
    /** Less than */
    LT = 'lt',
    /** Greater than or equal */
    GE = 'ge',
    /** Less than or equal */
    LE = 'le',
    /** Starts after (for dates) */
    SA = 'sa',
    /** Ends before (for dates) */
    EB = 'eb',
    /** Approximately equal */
    AP = 'ap'
}

/**
 * FHIR search parameter types as defined in the FHIR specification.
 * 
 * Each type requires different handling logic in the search implementation.
 * 
 * @see https://www.hl7.org/fhir/search.html#ptypes
 */
export enum FhirSearchParameterType {
    /** String parameters for text searches with partial matching */
    STRING = 'string',
    /** Date parameters supporting range queries and prefixes */
    DATE = 'date',
    /** Token parameters for exact code/identifier matching */
    TOKEN = 'token',
    /** Reference parameters for linking between resources */
    REFERENCE = 'reference',
    /** Number parameters supporting range queries and prefixes */
    NUMBER = 'number',
    /** Quantity parameters with units */
    QUANTITY = 'quantity',
    /** URI parameters for exact URI matching */
    URI = 'uri',
    /** Composite parameters combining multiple values */
    COMPOSITE = 'composite',
    /** Special parameters for advanced queries */
    SPECIAL = 'special'
}

/**
 * Environment types for application configuration.
 */
export enum Environment {
    DEVELOPMENT = 'development',
    TESTING = 'testing',
    STAGING = 'staging',
    PRODUCTION = 'production'
}

/**
 * Validation severity levels for FHIR operation outcomes.
 */
export enum ValidationSeverity {
    FATAL = 'fatal',
    ERROR = 'error',
    WARNING = 'warning',
    INFORMATION = 'information'
}

/**
 * Log levels for application logging.
 */
export enum LogLevel {
    ERROR = 'error',
    WARN = 'warn',
    INFO = 'info',
    DEBUG = 'debug',
    VERBOSE = 'verbose'
}

/**
 * API operation types for OpenAPI documentation.
 */
export enum ApiOperationType {
    CREATE = 'create',
    READ = 'read',
    UPDATE = 'update',
    DELETE = 'delete',
    SEARCH = 'search',
    PATCH = 'patch'
}

/**
 * FHIR search modes for Bundle entries
 */
export enum FhirSearchMode {
    MATCH = 'match',
    INCLUDE = 'include',
    OUTCOME = 'outcome'
}

/**
 * Common FHIR search parameter names
 */
export enum FhirSearchParameterName {
    ID = '_id',
    COUNT = '_count',
    OFFSET = '_offset',
    SORT = '_sort',
    INCLUDE = '_include',
    REVINCLUDE = '_revinclude'
}

/**
 * Common FHIR resource field names for consistent referencing
 */
export enum FhirFieldName {
    // Common fields
    RESOURCE_TYPE = 'resourceType',
    ID = 'id',
    META = 'meta',
    VERSION_ID = 'versionId',
    LAST_UPDATED = 'lastUpdated',

    // Patient fields
    NAME = 'name',
    FAMILY = 'family',
    GIVEN = 'given',
    BIRTH_DATE = 'birthDate',
    GENDER = 'gender',
    ACTIVE = 'active',
    IDENTIFIER = 'identifier',
    TELECOM = 'telecom',

    // Common reference fields
    SUBJECT = 'subject',
    PATIENT = 'patient',
    REFERENCE = 'reference',

    // Code/Coding fields
    CODE = 'code',
    CODING = 'coding',
    SYSTEM = 'system',
    VALUE = 'value',
    DISPLAY = 'display',

    // Status fields
    STATUS = 'status',
    CLINICAL_STATUS = 'clinicalStatus',
    VERIFICATION_STATUS = 'verificationStatus',

    // Date/Time fields
    DATE = 'date',
    EFFECTIVE_DATE_TIME = 'effectiveDateTime',
    PERFORMED_DATE_TIME = 'performedDateTime',
    AUTHORED_ON = 'authoredOn',
    START = 'start',
    END = 'end',
    PERIOD = 'period',

    // Medication fields
    MEDICATION_CODEABLE_CONCEPT = 'medicationCodeableConcept',
    INTENT = 'intent',

    // Encounter fields
    CLASS = 'class',

    // Observation fields
    CATEGORY = 'category',

    // Organization/Location fields
    TYPE = 'type',
    MANUFACTURER = 'manufacturer',

    // Appointment fields
    PARTICIPANT = 'participant',
    ACTOR = 'actor',

    // Family history fields
    RELATIONSHIP = 'relationship',
    CONDITION = 'condition',

    // Medication fields
    INGREDIENT = 'ingredient',
    ITEM_CODEABLE_CONCEPT = 'itemCodeableConcept',
    MEDICATION = 'medication',

    // Additional search parameter fields (hyphenated versions for search params)
    CLINICAL_STATUS_PARAM = 'clinical-status',
    VERIFICATION_STATUS_PARAM = 'verification-status',
    AUTHORED_ON_PARAM = 'authored-on',
    EFFECTIVE_DATE_PARAM = 'effective-date',
    CONDITION_CODE_PARAM = 'condition-code',
    PRACTITIONER = 'practitioner',
    BIRTH_DATE_PARAM = 'birthdate'
}

/**
 * Common FHIR JSON paths for database queries
 */
export enum FhirJsonPath {
    // Name paths
    NAME_FAMILY = "resource -> 'name' -> 0 ->> 'family'",
    NAME_GIVEN = "resource -> 'name' -> 0 ->> 'given'",

    // Identifier paths
    IDENTIFIER_SYSTEM = "resource -> 'identifier' -> 0 ->> 'system'",
    IDENTIFIER_VALUE = "resource -> 'identifier' -> 0 ->> 'value'",

    // Subject/Patient reference paths
    SUBJECT_REFERENCE = "resource -> 'subject' ->> 'reference'",
    PATIENT_REFERENCE = "resource -> 'patient' ->> 'reference'",

    // Code paths
    CODE_CODING_CODE = "resource -> 'code' -> 'coding' -> 0 ->> 'code'",
    MEDICATION_CODE = "resource -> 'medicationCodeableConcept' -> 'coding' -> 0 ->> 'code'",

    // Status paths
    STATUS = "resource ->> 'status'",
    CLINICAL_STATUS_CODE = "resource -> 'clinicalStatus' -> 'coding' -> 0 ->> 'code'",
    VERIFICATION_STATUS_CODE = "resource -> 'verificationStatus' -> 'coding' -> 0 ->> 'code'",

    // Date paths
    BIRTH_DATE = "resource ->> 'birthDate'",
    EFFECTIVE_DATE_TIME = "resource ->> 'effectiveDateTime'",
    PERFORMED_DATE_TIME = "resource ->> 'performedDateTime'",
    AUTHORED_ON = "resource ->> 'authoredOn'",
    DATE = "resource ->> 'date'",
    PERIOD_START = "resource -> 'period' ->> 'start'",
    APPOINTMENT_START = "resource ->> 'start'",

    // Boolean paths
    ACTIVE = "resource ->> 'active'",
    GENDER = "resource ->> 'gender'",
    INTENT = "resource ->> 'intent'",

    // Complex type paths
    TYPE_CODING_CODE = "resource -> 'type' -> 'coding' -> 0 ->> 'code'",
    TYPE_ARRAY_CODING_CODE = "resource -> 'type' -> 0 -> 'coding' -> 0 ->> 'code'",
    CATEGORY_CODING_CODE = "resource -> 'category' -> 0 -> 'coding' -> 0 ->> 'code'",
    CLASS_CODE = "resource -> 'class' ->> 'code'",

    // Organization/Name paths
    NAME = "resource ->> 'name'",

    // Manufacturer path
    MANUFACTURER_REFERENCE = "resource -> 'manufacturer' ->> 'reference'",

    // Ingredient path
    INGREDIENT_CODE = "resource -> 'ingredient' -> 0 -> 'itemCodeableConcept' -> 'coding' -> 0 ->> 'code'",

    // Relationship path
    RELATIONSHIP_CODE = "resource -> 'relationship' -> 'coding' -> 0 ->> 'code'",

    // Condition code path
    CONDITION_CODE = "resource -> 'condition' -> 0 -> 'code' -> 'coding' -> 0 ->> 'code'"
}

/**
 * FHIR OperationOutcome issue codes as defined in the FHIR specification.
 * 
 * @see https://www.hl7.org/fhir/valueset-issue-type.html
 */
export enum FhirIssueCode {
    /** Structural issue in the content */
    STRUCTURE = 'structure',
    /** Required element is missing */
    REQUIRED = 'required',
    /** Element value is invalid */
    INVALID = 'invalid',
    /** Processing exception */
    EXCEPTION = 'exception',
    /** Not supported operation or feature */
    NOT_SUPPORTED = 'not-supported',
    /** Duplicate resource or identifier */
    DUPLICATE = 'duplicate',
    /** Resource not found */
    NOT_FOUND = 'not-found',
    /** Business rule violation */
    BUSINESS_RULE = 'business-rule',
    /** Processing conflict */
    CONFLICT = 'conflict',
    /** Transient processing issue */
    TRANSIENT = 'transient',
    /** Lock error during processing */
    LOCK_ERROR = 'lock-error',
    /** No store available */
    NO_STORE = 'no-store',
    /** Content could not be parsed */
    CODE_INVALID = 'code-invalid',
    /** Extension not recognized */
    EXTENSION = 'extension',
    /** Operation timed out */
    TIMEOUT = 'timeout',
    /** Login required */
    LOGIN = 'login',
    /** User account unknown */
    UNKNOWN = 'unknown',
    /** Session expired */
    EXPIRED = 'expired',
    /** User account forbidden */
    FORBIDDEN = 'forbidden',
    /** User session suppressed */
    SUPPRESSED = 'suppressed',
    /** Processing has been stopped */
    PROCESSING = 'processing',
    /** Content not acceptable */
    NOT_ACCEPTABLE = 'not-acceptable',
    /** Security issue */
    SECURITY = 'security',
    /** Throttled processing */
    THROTTLED = 'throttled'
}

/**
 * Database error codes for PostgreSQL constraints and connection issues.
 */
export enum DatabaseErrorCode {
    /** PostgreSQL unique constraint violation */
    UNIQUE_VIOLATION = '23505',
    /** PostgreSQL foreign key constraint violation */
    FOREIGN_KEY_VIOLATION = '23503',
    /** PostgreSQL check constraint violation */
    CHECK_VIOLATION = '23514',
    /** PostgreSQL not null constraint violation */
    NOT_NULL_VIOLATION = '23502',
    /** Connection refused */
    CONNECTION_REFUSED = 'ECONNREFUSED',
    /** Connection timeout */
    CONNECTION_TIMEOUT = 'ETIMEDOUT'
}

/**
 * Common error message patterns for consistent error detection.
 */
export enum ErrorMessagePattern {
    /** Messages indicating resource not found */
    NOT_FOUND = 'not found',
    DOES_NOT_EXIST = 'does not exist',

    /** Messages indicating validation issues */
    VALIDATION = 'validation',
    INVALID = 'invalid',
    REQUIRED = 'required',
    MUST_BE = 'must be',

    /** Messages indicating constraint violations */
    UNIQUE = 'unique',
    FOREIGN_KEY = 'foreign key',
    CONSTRAINT = 'constraint',
    DUPLICATE_KEY = 'duplicate key',

    /** Messages indicating connection issues */
    CONNECTION = 'connection',
    CONNECT_ECONNREFUSED = 'connect econnrefused',
    TIMEOUT = 'timeout',
    TIMED_OUT = 'timed out'
}

/**
 * User-friendly error messages for common constraint violations.
 */
export enum ConstraintErrorMessage {
    UNIQUE_VIOLATION = 'Resource with this identifier already exists',
    FOREIGN_KEY_VIOLATION = 'Referenced resource does not exist',
    GENERAL_CONSTRAINT = 'Data constraint violation',
    DEFAULT = 'Database constraint violation'
}

/**
 * User-friendly error messages for validation issues.
 */
export enum ValidationErrorMessage {
    REQUIRED_FIELD = 'Required field missing',
    INVALID_VALUE = 'Invalid value',
    VALIDATION_FAILED = 'Resource validation failed'
}

/**
 * User-friendly error messages for system issues.
 */
export enum SystemErrorMessage {
    DATABASE_UNAVAILABLE = 'Database service temporarily unavailable',
    OPERATION_TIMEOUT = 'Operation timed out',
    TRANSACTION_ROLLBACK = 'Operation rolled back due to transaction failure',
    NOT_PROCESSED = 'Operation not processed due to earlier transaction failure',
    UNEXPECTED_ERROR = 'An unexpected error occurred during transaction processing',
    RESOURCE_NOT_FOUND_DEFAULT = 'Resource not found',
    UNKNOWN_STATUS = 'Unknown'
}

/**
 * Duplicate bundle detection and idempotency validation enums
 */

/**
 * Bundle idempotency strategies for handling duplicate submissions
 */
export enum IdempotencyStrategy {
    /** Reject duplicate bundles with error */
    REJECT = 'reject',
    /** Return cached response from previous execution */
    CACHED_RESPONSE = 'cached-response',
    /** Allow duplicate execution (not recommended for transactions) */
    ALLOW_DUPLICATE = 'allow-duplicate',
    /** Validate and return 409 if resources already exist */
    CONDITIONAL_PROCESSING = 'conditional-processing'
}

/**
 * Bundle log status values for tracking processing state and duplicate detection
 */
export enum BundleLogStatus {
    /** Bundle is currently being processed */
    PROCESSING = 'processing',
    /** Bundle processed successfully */
    SUCCESS = 'success',
    /** Bundle processing failed */
    FAILED = 'failed',
    /** Bundle processing partially successful */
    PARTIAL = 'partial',
    /** Bundle rejected as duplicate */
    DUPLICATE_REJECTED = 'duplicate-rejected',
    /** Bundle processed as cached duplicate */
    DUPLICATE_CACHED = 'duplicate-cached'
}

/**
 * Bundle identification methods for duplicate detection using bundle_log table
 */
export enum BundleIdentificationMethod {
    /** Use bundle.id field for duplicate detection */
    BUNDLE_ID = 'bundle-id',
    /** Generate hash from bundle content and store in bundle_summary */
    CONTENT_HASH = 'content-hash',
    /** Use client-provided idempotency key header stored in bundle_summary */
    IDEMPOTENCY_KEY = 'idempotency-key',
    /** Use txid for exact transaction matching */
    TRANSACTION_ID = 'transaction-id',
    /** Combination of multiple methods */
    COMPOSITE = 'composite'
}

/**
 * Bundle log query fields for duplicate detection
 */
export enum BundleLogField {
    /** Transaction ID field */
    TXID = 'txid',
    /** Bundle type field */
    BUNDLE_TYPE = 'bundleType',
    /** Bundle summary JSONB field */
    BUNDLE_SUMMARY = 'bundleSummary',
    /** Processing status field */
    STATUS = 'status',
    /** Submitted timestamp */
    SUBMITTED_AT = 'submittedAt',
    /** Completed timestamp */
    COMPLETED_AT = 'completedAt',
    /** Source system identifier */
    SOURCE_SYSTEM = 'sourceSystem',
    /** User who submitted the bundle */
    SUBMITTED_BY = 'submittedBy'
}

/**
 * Duplicate bundle processing results
 */
export enum DuplicateBundleResult {
    /** First time processing this bundle */
    FIRST_SUBMISSION = 'first-submission',
    /** Exact duplicate - return cached response */
    EXACT_DUPLICATE = 'exact-duplicate',
    /** Partial duplicate - some resources already exist */
    PARTIAL_DUPLICATE = 'partial-duplicate',
    /** Content changed since first submission */
    CONTENT_MODIFIED = 'content-modified',
    /** Bundle ID reused with different content */
    ID_COLLISION = 'id-collision'
}

/**
 * Duplicate validation types for bundle processing
 */
export enum DuplicateValidationType {
    /** Exact match - identical bundle content */
    EXACT_MATCH = 'exact-match',
    /** Content mismatch - same ID, different content */
    CONTENT_MISMATCH = 'content-mismatch',
    /** ID collision - same ID, different bundle */
    ID_COLLISION = 'id-collision',
    /** Partial duplicate - some resources duplicated */
    PARTIAL_DUPLICATE = 'partial-duplicate',
    /** Idempotency violation */
    IDEMPOTENCY_VIOLATION = 'idempotency-violation'
}

/**
 * Bundle resource types for FHIR responses
 */
export enum BundleResourceType {
    BUNDLE = 'Bundle'
}

/**
 * Bundle types for FHIR bundle responses
 */
export enum BundleType {
    TRANSACTION_RESPONSE = 'transaction-response',
    BATCH_RESPONSE = 'batch-response',
    HISTORY = 'history',
    SEARCHSET = 'searchset',
    COLLECTION = 'collection'
}

/**
 * Duplicate detection tags for bundle metadata
 */
export enum DuplicateDetectionTag {
    /** System URL for duplicate detection tags */
    SYSTEM = 'http://hl7.org/fhir/StructureDefinition/duplicate-detection',
    /** Tag for cached responses */
    CACHED_RESPONSE = 'cached-response',
    /** Tag for duplicate detected */
    DUPLICATE_DETECTED = 'duplicate-detected',
    /** Tag for first submission */
    FIRST_SUBMISSION = 'first-submission'
}

/**
 * Bundle log extension URLs for FHIR metadata
 */
export enum BundleLogExtension {
    /** Extension URL for original transaction ID */
    ORIGINAL_TXID = 'http://fhir.local/StructureDefinition/original-txid',
    /** Extension URL for original timestamp */
    ORIGINAL_TIMESTAMP = 'http://fhir.local/StructureDefinition/original-timestamp',
    /** Extension URL for bundle status */
    BUNDLE_STATUS = 'http://fhir.local/StructureDefinition/bundle-status',
    /** Extension URL for detection method */
    DETECTION_METHOD = 'http://fhir.local/StructureDefinition/detection-method'
}

/**
 * Bundle validation severity levels for duplicate detection
 */
export enum DuplicateValidationSeverity {
    /** Strict validation - reject any duplicates */
    STRICT = 'strict',
    /** Moderate validation - allow if content identical */
    MODERATE = 'moderate',
    /** Lenient validation - warn but allow processing */
    LENIENT = 'lenient',
    /** Disabled - no duplicate checking */
    DISABLED = 'disabled'
}

/**
 * User-friendly messages for duplicate bundle scenarios using bundle_log table
 */
export enum DuplicateBundleMessage {
    EXACT_DUPLICATE = 'Bundle has been processed previously. Returning cached response from bundle log.',
    PARTIAL_DUPLICATE = 'Some resources in this bundle already exist. Check bundle log for details.',
    CONTENT_MODIFIED = 'Bundle ID matches previous submission but content has changed. Check bundle log history.',
    ID_COLLISION = 'Bundle ID collision detected in bundle log. The same ID was used for different bundle content.',
    IDEMPOTENCY_VIOLATION = 'Idempotency violation: Bundle content differs from previous submission found in bundle log.',
    PROCESSING_PREVENTED = 'Duplicate bundle submission prevented. Previous transaction found in bundle log.',
    CACHED_RESPONSE_RETURNED = 'Returning cached response from bundle log entry.',
    TXID_EXISTS = 'Transaction ID already exists in bundle log.',
    BUNDLE_LOG_LOOKUP_FAILED = 'Unable to verify duplicate status due to bundle log query failure.'
}

/**
 * HTTP headers for idempotency and duplicate detection
 */
export enum IdempotencyHeader {
    /** Client-provided idempotency key */
    IDEMPOTENCY_KEY = 'Idempotency-Key',
    /** Server response indicating duplicate detection */
    DUPLICATE_DETECTED = 'X-Duplicate-Detected',
    /** Server response with original transaction ID */
    ORIGINAL_TRANSACTION_ID = 'X-Original-Transaction-Id',
    /** Server response indicating cache usage */
    CACHE_STATUS = 'X-Cache-Status',
    /** Content hash for verification */
    CONTENT_HASH = 'X-Content-Hash'
}

/**
 * Cache status values for duplicate bundle responses
 */
export enum CacheStatus {
    /** Response served from cache */
    HIT = 'hit',
    /** New processing, response cached */
    MISS = 'miss',
    /** Cache validation required */
    REVALIDATE = 'revalidate',
    /** Cache bypassed */
    BYPASS = 'bypass'
}
