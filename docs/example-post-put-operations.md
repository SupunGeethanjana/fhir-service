# FHIR Transaction Service - POST, PUT, and PATCH Operations

## Overview

The FHIR Transaction Service now supports three main HTTP operations with advanced features:

- **POST**: Creates new resources with intelligent duplicate detection and smart merging for Patient resources
- **PUT**: Updates existing resources or creates them if not found (upsert behavior)
- **PATCH**: Performs partial updates by merging provided fields with existing resource

## POST Operation Features

### Smart Duplicate Detection (Patient Resources)
- Checks identifiers (system + value) against existing database records
- Tracks processed resources within the same bundle to prevent duplicates
- Analyzes if new data contains additional information worth merging
- Performs additive-only merging without removing existing data

### Intelligent Patient Merging
When a duplicate Patient is detected, the system:
1. **Analyzes New Information**: Checks for additional contact info, addresses, identifiers, names, demographics
2. **Smart Merging**: Combines new data with existing patient data
3. **Safe Operations**: Never removes existing information, only adds new data
4. **Response Handling**: Returns HTTP 200 with existing or updated resource

## PUT Operation Features

### Upsert Behavior
- Updates existing resource if found
- Creates resource with specified ID if not found
- Validates request URL matches resource type
- Supports reference resolution within bundle

## PATCH Operation Features

### Partial Update Behavior
- Merges provided fields with existing resource
- Requires resource to exist (no upsert behavior)
- Intelligent field merging for arrays and objects
- Preserves existing data while applying only specified changes

### Smart Field Merging
- **Arrays**: Intelligent merging for identifiers, names, telecom, addresses
- **Objects**: Deep merge preserving existing structure
- **Primitives**: Direct replacement
- **Special Fields**: Preserves FHIR meta information

## Example PATCH Transaction Bundle

```json
{
  "resourceType": "Bundle",
  "type": "transaction",
  "entry": [
    {
      "fullUrl": "urn:uuid:patient-patch-1",
      "resource": {
        "resourceType": "Patient",
        "id": "patient-123",
        "telecom": [
          {
            "system": "email",
            "value": "john.updated@email.com",
            "use": "work"
          }
        ],
        "address": [
          {
            "use": "work",
            "line": ["456 Business Ave"],
            "city": "Business City",
            "state": "CA",
            "postalCode": "54321"
          }
        ],
        "maritalStatus": {
          "coding": [
            {
              "system": "http://terminology.hl7.org/CodeSystem/v3-MaritalStatus",
              "code": "M",
              "display": "Married"
            }
          ]
        }
      },
      "request": {
        "method": "PATCH",
        "url": "Patient/patient-123"
      }
    },
    {
      "fullUrl": "urn:uuid:observation-patch-1",
      "resource": {
        "resourceType": "Observation",
        "id": "obs-456",
        "status": "amended",
        "valueQuantity": {
          "value": 78,
          "unit": "beats/min",
          "system": "http://unitsofmeasure.org",
          "code": "/min"
        },
        "note": [
          {
            "text": "Updated measurement after review"
          }
        ]
      },
      "request": {
        "method": "PATCH",
        "url": "Observation/obs-456"
      }
    }
  ]
}
```

### Expected PATCH Response
```json
{
  "resourceType": "Bundle",
  "type": "transaction-response",
  "entry": [
    {
      "response": {
        "status": "200 OK",
        "location": "Patient/patient-123/_history/3"
      }
    },
    {
      "response": {
        "status": "200 OK",
        "location": "Observation/obs-456/_history/2"
      }
    }
  ]
}
```

## Mixed Operations Transaction Bundle

```json
{
  "resourceType": "Bundle",
  "type": "transaction",
  "entry": [
    {
      "fullUrl": "urn:uuid:new-patient",
      "resource": {
        "resourceType": "Patient",
        "identifier": [
          {
            "system": "http://hospital.com/patient-id",
            "value": "67890"
          }
        ],
        "name": [
          {
            "use": "official",
            "family": "Doe",
            "given": ["Jane"]
          }
        ],
        "gender": "female"
      },
      "request": {
        "method": "POST",
        "url": "Patient"
      }
    },
    {
      "fullUrl": "urn:uuid:update-existing-patient",
      "resource": {
        "resourceType": "Patient",
        "id": "patient-123",
        "identifier": [
          {
            "system": "http://hospital.com/patient-id",
            "value": "12345"
          }
        ],
        "name": [
          {
            "use": "official",
            "family": "Smith",
            "given": ["John", "William"]
          }
        ],
        "gender": "male",
        "birthDate": "1990-01-15"
      },
      "request": {
        "method": "PUT",
        "url": "Patient/patient-123"
      }
    },
    {
      "fullUrl": "urn:uuid:patch-patient-contact",
      "resource": {
        "resourceType": "Patient",
        "id": "patient-456",
        "telecom": [
          {
            "system": "phone",
            "value": "+1-555-987-6543",
            "use": "mobile"
          }
        ]
      },
      "request": {
        "method": "PATCH",
        "url": "Patient/patient-456"
      }
    },
    {
      "fullUrl": "urn:uuid:observation-for-new",
      "resource": {
        "resourceType": "Observation",
        "status": "final",
        "code": {
          "coding": [
            {
              "system": "http://loinc.org",
              "code": "29463-7",
              "display": "Body Weight"
            }
          ]
        },
        "subject": {
          "reference": "urn:uuid:new-patient"
        },
        "valueQuantity": {
          "value": 68,
          "unit": "kg"
        }
      },
      "request": {
        "method": "POST",
        "url": "Observation"
      }
    }
  ]
}
```

## Operation Comparison

| Feature | POST | PUT | PATCH |
|---------|------|-----|-------|
| **ID Handling** | System generates ID | Must specify ID in URL and resource | Must specify ID in URL |
| **Duplicate Detection** | Smart detection for Patient resources | Not applicable (updates by ID) | Not applicable (updates by ID) |
| **Behavior if Exists** | Creates duplicate or merges (Patients) | Updates the resource | Partially updates the resource |
| **Behavior if Not Exists** | Creates new resource | Creates with specified ID | Error (resource must exist) |
| **Data Handling** | Complete resource | Complete resource replacement | Partial update with intelligent merging |
| **Reference Resolution** | Yes, resolves bundle references | Yes, resolves bundle references | Yes, resolves bundle references |
| **Response Status** | 201 (create) or 200 (existing/updated) | 200 (update) or 201 (create) | 200 (update only) |

## PATCH Operation Deep Dive

### Field Merging Strategies

#### Arrays
- **Identifiers**: Merge unique identifiers based on system + value
- **Names**: Add new name variations, keep existing
- **Telecom**: Merge based on system + value uniqueness
- **Addresses**: Add new addresses, merge by JSON comparison
- **Complex Arrays**: Intelligent merging by ID or content comparison
- **Generic Arrays**: Replace entire array (standard FHIR behavior)

#### Objects
- **Deep Merge**: Recursively merge nested objects
- **Preserve Structure**: Maintains existing object hierarchy
- **Field Replacement**: Primitive values replace existing values

#### Special Handling
- **Meta Fields**: Automatically updated with lastUpdated timestamp
- **Resource Type**: Ignored in patch data
- **ID**: Set from URL, overrides patch data

### Example PATCH Merging

**Existing Patient:**
```json
{
  "resourceType": "Patient",
  "id": "patient-123",
  "identifier": [
    {
      "system": "http://hospital.com/patient-id",
      "value": "12345"
    }
  ],
  "name": [
    {
      "use": "official",
      "family": "Smith",
      "given": ["John"]
    }
  ],
  "telecom": [
    {
      "system": "phone",
      "value": "+1-555-123-4567",
      "use": "home"
    }
  ],
  "gender": "male",
  "birthDate": "1990-01-15"
}
```

**PATCH Data:**
```json
{
  "resourceType": "Patient",
  "id": "patient-123",
  "name": [
    {
      "use": "official",
      "family": "Smith",
      "given": ["John", "William"]
    }
  ],
  "telecom": [
    {
      "system": "email",
      "value": "john.smith@email.com",
      "use": "home"
    }
  ],
  "maritalStatus": {
    "coding": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/v3-MaritalStatus",
        "code": "M",
        "display": "Married"
      }
    ]
  }
}
```

**Merged Result:**
```json
{
  "resourceType": "Patient",
  "id": "patient-123",
  "identifier": [
    {
      "system": "http://hospital.com/patient-id",
      "value": "12345"
    }
  ],
  "name": [
    {
      "use": "official",
      "family": "Smith",
      "given": ["John", "William"]
    }
  ],
  "telecom": [
    {
      "system": "phone",
      "value": "+1-555-123-4567",
      "use": "home"
    },
    {
      "system": "email",
      "value": "john.smith@email.com",
      "use": "home"
    }
  ],
  "gender": "male",
  "birthDate": "1990-01-15",
  "maritalStatus": {
    "coding": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/v3-MaritalStatus",
        "code": "M",
        "display": "Married"
      }
    ]
  },
  "meta": {
    "lastUpdated": "2025-01-15T14:30:00.000Z"
  }
}
```

## Error Handling

### POST Errors
```json
{
  "error": "Bundle validation failed",
  "details": "Entry 0 is missing resource"
}
```

### PUT Errors
```json
{
  "error": "Invalid PUT request URL: InvalidUrl. Expected format: Patient/[id]"
}
```

### PATCH Errors
```json
{
  "error": "Resource Patient/non-existent-id not found for PATCH operation"
}
```

### Resource Type Mismatch
```json
{
  "error": "Resource type mismatch: URL contains 'Observation' but resource is 'Patient'"
}
```

## Best Practices

### When to Use POST
- Creating new resources without specific IDs
- Leveraging duplicate detection for Patient resources
- Bulk creation of related resources

### When to Use PUT
- Updating resources with known IDs
- Implementing upsert behavior
- Complete resource replacement
- Maintaining specific resource identifiers

### When to Use PATCH
- Partial updates when you only want to change specific fields
- Adding new information without affecting existing data
- Updating contact information or addresses
- Modifying status or adding notes

### Mixed Operations
- Use POST for new primary resources (Patients)
- Use PUT for complete updates with known IDs
- Use PATCH for partial updates
- Leverage reference resolution for relationships

## Implementation Notes

- All operations are atomic within a transaction bundle
- Reference resolution works across all operations
- Patient duplicate detection uses identifier-based matching
- Smart merging preserves existing data while adding new information
- PATCH operations require existing resources
- Comprehensive error handling with detailed messages
- Full audit trail logging for compliance and debugging
- Intelligent field merging based on FHIR standards
