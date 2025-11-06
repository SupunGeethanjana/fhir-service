# Common Response Classes for REST and GraphQL APIs

This directory contains standardized response classes that work seamlessly with both REST APIs and GraphQL resolvers. The response structure provides consistency across all endpoints and improves API documentation and client integration.

## Overview

The common response system includes:

- **Standardized response structure** with success/error states
- **Automatic Swagger documentation** via decorators
- **GraphQL compatibility** with proper type definitions
- **Pagination support** for list endpoints
- **Bulk operation responses** for batch processing
- **Helper utilities** for common response patterns

## Core Classes

### 1. `ApiResponse<T>`
Base response class with common fields:
```typescript
{
  success: boolean;
  message?: string;
  timestamp: Date;
  requestId?: string;
}
```

### 2. `ApiSuccessResponse<T>`
Success response with data payload:
```typescript
{
  success: true;
  message: string;
  timestamp: Date;
  requestId?: string;
  data?: T;
}
```

### 3. `ApiErrorResponse`
Error response with detailed error information:
```typescript
{
  success: false;
  message: string;
  timestamp: Date;
  requestId?: string;
  errorCode: string;
  errors?: string[];
  statusCode: number;
}
```

### 4. `PaginatedResponse<T>`
Paginated list response:
```typescript
{
  success: true;
  message: string;
  timestamp: Date;
  requestId?: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    offset: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
```

### 5. `BulkOperationResponse`
Response for bulk operations:
```typescript
{
  success: true;
  message: string;
  timestamp: Date;
  requestId?: string;
  successCount: number;
  failureCount: number;
  totalCount: number;
  failures?: BulkFailureDetail[];
}
```

## Usage Examples

### REST Controller

```typescript
import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiSuccessResponse, PaginatedResponse } from '../common/dtos/api-response.dto';
import { ResponseBuilder } from '../common/dtos/response-builder';

@Controller('patients')
export class PatientController {
  
  @Get()
  async getPatients(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20
  ): Promise<PaginatedResponse<Patient> | ApiErrorResponse> {
    try {
      const patients = await this.patientService.findAll(page, limit);
      const total = await this.patientService.count();
      
      return ResponseBuilder.paginated(patients, page, limit, total);
    } catch (error) {
      return ResponseBuilder.internalError('Failed to retrieve patients');
    }
  }

  @Post()
  async createPatient(@Body() createPatientDto: CreatePatientDto): Promise<ApiSuccessResponse<Patient> | ApiErrorResponse> {
    try {
      const patient = await this.patientService.create(createPatientDto);
      return ResponseBuilder.created(patient, 'Patient created successfully');
    } catch (error) {
      if (error instanceof ValidationError) {
        return ResponseBuilder.validationError(error.messages);
      }
      return ResponseBuilder.internalError('Failed to create patient');
    }
  }
}
```

### GraphQL Resolver

```typescript
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { ApiSuccessResponse, PaginatedResponse } from '../common/dtos/api-response.dto';
import { ResponseBuilder } from '../common/dtos/response-builder';

@Resolver()
export class PatientResolver {
  
  @Query(() => PaginatedResponse)
  async patients(
    @Args('page', { defaultValue: 1 }) page: number,
    @Args('limit', { defaultValue: 20 }) limit: number
  ): Promise<PaginatedResponse<Patient> | ApiErrorResponse> {
    try {
      const patients = await this.patientService.findAll(page, limit);
      const total = await this.patientService.count();
      
      return ResponseBuilder.paginated(patients, page, limit, total);
    } catch (error) {
      return ResponseBuilder.internalError('Failed to retrieve patients');
    }
  }

  @Mutation(() => ApiSuccessResponse)
  async createPatient(
    @Args('input') createPatientInput: CreatePatientInput
  ): Promise<ApiSuccessResponse<Patient> | ApiErrorResponse> {
    try {
      const patient = await this.patientService.create(createPatientInput);
      return ResponseBuilder.created(patient, 'Patient created successfully');
    } catch (error) {
      return ResponseBuilder.internalError('Failed to create patient');
    }
  }
}
```

## ResponseBuilder Utility

The `ResponseBuilder` class provides convenient methods for creating standardized responses:

### Success Responses
```typescript
// Basic success
ResponseBuilder.success(data, 'Operation successful');

// Created resource
ResponseBuilder.created(newResource, 'Resource created');

// Updated resource
ResponseBuilder.updated(updatedResource, 'Resource updated');

// Deleted resource
ResponseBuilder.deleted('Resource deleted');

// No content
ResponseBuilder.noContent('Operation completed');

// Paginated results
ResponseBuilder.paginated(items, page, limit, total);

// Bulk operation
ResponseBuilder.bulk(successCount, failureCount, failures);
```

### Error Responses
```typescript
// Generic error
ResponseBuilder.error('ERROR_CODE', 'Error message', 400);

// Validation error
ResponseBuilder.validationError(['Field is required', 'Invalid format']);

// Not found
ResponseBuilder.notFound('Patient', 'patient-123');

// Unauthorized
ResponseBuilder.unauthorized('Login required');

// Forbidden
ResponseBuilder.forbidden('Insufficient permissions');

// Conflict
ResponseBuilder.conflict('Resource already exists');

// Internal server error
ResponseBuilder.internalError('Something went wrong');
```

## Error Codes

Use the predefined error codes from `ErrorCodes` constant:

```typescript
import { ErrorCodes } from '../common/dtos/response-builder';

// Validation errors
ErrorCodes.VALIDATION_ERROR
ErrorCodes.INVALID_INPUT
ErrorCodes.MISSING_REQUIRED_FIELD

// Authentication/Authorization
ErrorCodes.UNAUTHORIZED
ErrorCodes.FORBIDDEN
ErrorCodes.INVALID_TOKEN

// Resource errors
ErrorCodes.NOT_FOUND
ErrorCodes.ALREADY_EXISTS
ErrorCodes.CONFLICT

// FHIR specific
ErrorCodes.FHIR_VALIDATION_ERROR
ErrorCodes.INVALID_FHIR_RESOURCE

// And many more...
```

## Benefits

1. **Consistency**: All APIs return the same response structure
2. **Documentation**: Automatic Swagger docs with proper types
3. **Error Handling**: Standardized error responses with codes
4. **Pagination**: Built-in pagination metadata
5. **Tracing**: Request ID support for debugging
6. **Type Safety**: Full TypeScript support
7. **GraphQL Compatible**: Works seamlessly with GraphQL
8. **Extensible**: Easy to add new response types

## Best Practices

1. **Always use ResponseBuilder** instead of creating response objects manually
2. **Include meaningful error messages** and appropriate error codes
3. **Use pagination** for list endpoints that might return large datasets
4. **Include request IDs** for tracing and debugging
5. **Handle validation errors** consistently across all endpoints
6. **Document expected response types** in Swagger decorators
7. **Use appropriate HTTP status codes** that match the response content

## Integration with Existing Code

To integrate with existing endpoints:

1. Update return types to use the common response classes
2. Replace manual response creation with ResponseBuilder methods
3. Add proper Swagger decorators for documentation
4. Update error handling to use standardized error responses
5. Add pagination support to list endpoints

This approach ensures consistent API behavior and improved developer experience across both REST and GraphQL interfaces.
