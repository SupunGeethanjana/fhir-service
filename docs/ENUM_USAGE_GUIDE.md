# FHIR Service Enum Usage Guide

## Overview

This guide demonstrates how to use the standardized enums in the FHIR service codebase to improve type safety and maintainability.

## Available Enums

### Core FHIR Enums

```typescript
import {
    HttpMethod,
    FhirResourceType,
    FhirBundleType,
    FhirInteractionType,
    LogLevel,
    ValidationSeverity,
    FhirStatus,
    Gender,
    ContactSystem,
    IdentifierUse
} from './common/enums/fhir-enums';
```

## Usage Examples

### 1. HTTP Methods

**❌ Before (Magic Strings):**
```typescript
const method = 'POST';
if (request.method === 'GET') {
    // handle GET request
}
```

**✅ After (Using Enum):**
```typescript
const method = HttpMethod.POST;
if (request.method === HttpMethod.GET) {
    // handle GET request
}
```

### 2. Log Levels

**❌ Before (Magic Strings):**
```typescript
const logLevels = ['error', 'warn', 'log', 'debug', 'verbose'];
```

**✅ After (Using Enum):**
```typescript
const logLevels = [
    LogLevel.ERROR, 
    LogLevel.WARN, 
    LogLevel.INFO, 
    LogLevel.DEBUG, 
    LogLevel.VERBOSE
];
```

### 3. Validation Severity

**❌ Before (Magic Strings):**
```typescript
const error = {
    path: 'patient.identifier',
    message: 'Invalid identifier format',
    code: 'INVALID_IDENTIFIER',
    severity: 'error'
};
```

**✅ After (Using Enum):**
```typescript
const error = {
    path: 'patient.identifier',
    message: 'Invalid identifier format',
    code: 'INVALID_IDENTIFIER',
    severity: ValidationSeverity.ERROR
};
```

### 4. FHIR Resource Status

**❌ Before (Magic Strings):**
```typescript
const patient = {
    resourceType: 'Patient',
    active: true,
    status: 'active'
};
```

**✅ After (Using Enum):**
```typescript
const patient = {
    resourceType: FhirResourceType.PATIENT,
    active: true,
    status: FhirStatus.ACTIVE
};
```

### 5. Gender Values

**❌ Before (Magic Strings):**
```typescript
const patient = {
    gender: 'male',
    // ...
};

if (patient.gender === 'female') {
    // handle female patient
}
```

**✅ After (Using Enum):**
```typescript
const patient = {
    gender: Gender.MALE,
    // ...
};

if (patient.gender === Gender.FEMALE) {
    // handle female patient
}
```

### 6. Contact System Types

**❌ Before (Magic Strings):**
```typescript
const telecom = [
    {
        system: 'phone',
        value: '+1-555-123-4567',
        use: 'home'
    },
    {
        system: 'email',
        value: 'patient@example.com',
        use: 'home'
    }
];
```

**✅ After (Using Enum):**
```typescript
const telecom = [
    {
        system: ContactSystem.PHONE,
        value: '+1-555-123-4567',
        use: IdentifierUse.USUAL
    },
    {
        system: ContactSystem.EMAIL,
        value: 'patient@example.com',
        use: IdentifierUse.USUAL
    }
];
```

### 7. Bundle Operations

**❌ Before (Magic Strings):**
```typescript
const bundleEntry = {
    request: {
        method: 'POST',
        url: 'Patient'
    },
    resource: patientResource
};
```

**✅ After (Using Enum):**
```typescript
const bundleEntry = {
    request: {
        method: HttpMethod.POST,
        url: FhirResourceType.PATIENT
    },
    resource: patientResource
};
```

## Transaction Service Examples

### Creating a Transaction Bundle

**✅ Using Enums:**
```typescript
const transactionBundle = {
    resourceType: FhirResourceType.BUNDLE,
    type: FhirBundleType.TRANSACTION,
    entry: [
        {
            request: {
                method: HttpMethod.POST,
                url: FhirResourceType.PATIENT
            },
            resource: {
                resourceType: FhirResourceType.PATIENT,
                active: true,
                gender: Gender.FEMALE,
                telecom: [
                    {
                        system: ContactSystem.EMAIL,
                        value: 'jane.doe@example.com',
                        use: IdentifierUse.USUAL
                    }
                ]
            }
        }
    ]
};
```

### Error Handling with Validation Severity

**✅ Using Enums:**
```typescript
const validationResult = {
    isValid: false,
    errors: [
        {
            path: 'Patient.gender',
            message: 'Invalid gender value',
            code: 'INVALID_GENDER',
            severity: ValidationSeverity.ERROR
        }
    ],
    warnings: [
        {
            path: 'Patient.telecom[0].value',
            message: 'Phone number format could be improved',
            code: 'PHONE_FORMAT_WARNING',
            severity: ValidationSeverity.WARNING
        }
    ]
};
```

## Benefits of Using Enums

### 1. Type Safety
- Compile-time error checking prevents typos
- IDE autocomplete reduces errors
- Refactoring becomes safer and easier

### 2. Maintainability
- Single source of truth for constant values
- Easy to find all usages of a particular value
- Self-documenting code

### 3. IntelliSense Support
- Better IDE support with value suggestions
- Clear documentation of available options
- Reduced cognitive load when coding

### 4. Consistency
- Standardized values across the entire codebase
- Prevents inconsistent string representations
- Easier code reviews

## Migration Strategy

### Phase 1: Core Infrastructure (✅ Completed)
- [x] Created comprehensive enum definitions
- [x] Updated main.ts to use LogLevel enum
- [x] Updated validation files to use ValidationSeverity enum

### Phase 2: Model Updates (Recommended Next)
- [ ] Update Patient model to use Gender enum
- [ ] Update Contact/Telecom models to use ContactSystem enum
- [ ] Update identifier fields to use IdentifierUse enum

### Phase 3: Status Field Updates
- [ ] Update all FHIR resources to use FhirStatus enum
- [ ] Review observation status fields
- [ ] Update diagnostic report status fields

### Phase 4: Bundle and Transaction Updates
- [ ] Ensure all bundle operations use appropriate enums
- [ ] Update GraphQL resolvers to use enums
- [ ] Update API documentation to reference enums

## Best Practices

### 1. Always Import Enums
```typescript
// Good
import { Gender, ContactSystem } from './common/enums/fhir-enums';

// Avoid inline string literals
const gender = Gender.FEMALE; // ✅
const gender = 'female';      // ❌
```

### 2. Use Enum Values in Comparisons
```typescript
// Good
if (patient.gender === Gender.MALE) {
    // handle male patient
}

// Avoid
if (patient.gender === 'male') {
    // less safe
}
```

### 3. Type Function Parameters
```typescript
// Good
function processPatient(gender: Gender, status: FhirStatus) {
    // implementation
}

// Less ideal
function processPatient(gender: string, status: string) {
    // implementation
}
```

### 4. Use Enums in Switch Statements
```typescript
switch (patient.gender) {
    case Gender.MALE:
        // handle male
        break;
    case Gender.FEMALE:
        // handle female
        break;
    case Gender.OTHER:
        // handle other
        break;
    case Gender.UNKNOWN:
        // handle unknown
        break;
    default:
        // TypeScript will warn if we miss a case
        break;
}
```

## Testing with Enums

```typescript
describe('Patient Processing', () => {
    it('should handle male patients correctly', () => {
        const patient = createTestPatient({
            gender: Gender.MALE,
            status: FhirStatus.ACTIVE
        });
        
        expect(patient.gender).toBe(Gender.MALE);
        expect(patient.status).toBe(FhirStatus.ACTIVE);
    });
});
```

## Conclusion

Using enums throughout the FHIR service improves code quality, reduces bugs, and makes the codebase more maintainable. The migration to enum usage should be done gradually, starting with the most critical paths and expanding to cover the entire codebase over time.
