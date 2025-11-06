# FHIR Transaction Bundle PUT Operation Examples

## Overview

The FHIR Transaction Service now supports PUT operations for updating existing resources or creating them if they don't exist (upsert behavior).

## PUT Operation Behavior

1. **Update Existing Resource**: If the resource exists, it will be updated with the new data
2. **Create If Not Found**: If the resource doesn't exist, it will be created with the specified ID
3. **URL Validation**: The request URL must match the resource type and contain a valid ID
4. **Transactional**: All operations within the bundle are atomic

## Example PUT Transaction Bundle

```json
{
  "resourceType": "Bundle",
  "type": "transaction",
  "entry": [
    {
      "fullUrl": "urn:uuid:patient-update-1",
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
        "birthDate": "1990-01-15",
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
        "address": [
          {
            "use": "home",
            "line": ["123 Main Street"],
            "city": "Anytown",
            "state": "CA",
            "postalCode": "12345",
            "country": "US"
          }
        ]
      },
      "request": {
        "method": "PUT",
        "url": "Patient/patient-123"
      }
    },
    {
      "fullUrl": "urn:uuid:observation-update-1",
      "resource": {
        "resourceType": "Observation",
        "id": "obs-456",
        "status": "final",
        "category": [
          {
            "coding": [
              {
                "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                "code": "vital-signs"
              }
            ]
          }
        ],
        "code": {
          "coding": [
            {
              "system": "http://loinc.org",
              "code": "8867-4",
              "display": "Heart rate"
            }
          ]
        },
        "subject": {
          "reference": "urn:uuid:patient-update-1"
        },
        "valueQuantity": {
          "value": 72,
          "unit": "beats/min",
          "system": "http://unitsofmeasure.org",
          "code": "/min"
        },
        "effectiveDateTime": "2025-01-15T10:30:00Z"
      },
      "request": {
        "method": "PUT",
        "url": "Observation/obs-456"
      }
    }
  ]
}
```

## Expected Response Scenarios

### Scenario 1: Resource Exists (Update)
```json
{
  "resourceType": "Bundle",
  "type": "transaction-response",
  "entry": [
    {
      "response": {
        "status": "200 OK",
        "location": "Patient/patient-123/_history/2"
      }
    },
    {
      "response": {
        "status": "200 OK",
        "location": "Observation/obs-456/_history/3"
      }
    }
  ]
}
```

### Scenario 2: Resource Doesn't Exist (Create)
```json
{
  "resourceType": "Bundle",
  "type": "transaction-response",
  "entry": [
    {
      "response": {
        "status": "201 Created",
        "location": "Patient/patient-123/_history/1"
      }
    },
    {
      "response": {
        "status": "201 Created",
        "location": "Observation/obs-456/_history/1"
      }
    }
  ]
}
```

## PUT vs POST Comparison

| Operation | PUT | POST |
|-----------|-----|------|
| **ID Handling** | Must specify ID in URL and resource | System generates ID (unless provided) |
| **Duplicate Detection** | Not applicable (updates by ID) | Smart detection for Patient resources |
| **Behavior if Exists** | Updates the resource | Creates duplicate or merges (Patients) |
| **Behavior if Not Exists** | Creates with specified ID | Creates new resource |
| **Reference Resolution** | Yes, resolves bundle references | Yes, resolves bundle references |
| **Response Status** | 200 (update) or 201 (create) | 201 (create) or 200 (existing) |

## Error Handling

### Invalid URL Format
```json
{
  "request": {
    "method": "PUT",
    "url": "InvalidUrl"  // Missing resource type/ID
  }
}
```
**Error**: `Invalid PUT request URL: InvalidUrl. Expected format: Patient/[id]`

### Resource Type Mismatch
```json
{
  "resource": {
    "resourceType": "Patient"
  },
  "request": {
    "method": "PUT",
    "url": "Observation/123"  // Mismatch!
  }
}
```
**Error**: `Resource type mismatch: URL contains 'Observation' but resource is 'Patient'`

## Advanced Features

### Reference Resolution
Just like POST operations, PUT operations support reference resolution within the bundle:

```json
{
  "entry": [
    {
      "fullUrl": "urn:uuid:patient-1",
      "resource": {
        "resourceType": "Patient",
        "id": "patient-123"
      },
      "request": {
        "method": "PUT",
        "url": "Patient/patient-123"
      }
    },
    {
      "fullUrl": "urn:uuid:observation-1",
      "resource": {
        "resourceType": "Observation",
        "subject": {
          "reference": "urn:uuid:patient-1"  // Will resolve to Patient/patient-123
        }
      },
      "request": {
        "method": "PUT",
        "url": "Observation/obs-456"
      }
    }
  ]
}
```

### Transactional Integrity
All PUT operations within a bundle are atomic:
- If any operation fails, the entire transaction is rolled back
- All operations succeed together or fail together
- Maintains data consistency across related resources

## Best Practices

1. **Use PUT for Known IDs**: When you have specific resource IDs to update
2. **Use POST for New Resources**: When creating new resources without specific IDs
3. **Validate URLs**: Ensure request URLs match the resource type and contain valid IDs
4. **Handle Upsert Behavior**: Be aware that PUT will create resources if they don't exist
5. **Consider Versioning**: PUT operations will increment the resource version
6. **Reference Resolution**: Use bundle references for relationships between resources in the same transaction

## Implementation Notes

- The PUT operation validates that the request URL matches the resource type
- Resource ID is extracted from the URL and set on the resource before saving
- If the resource doesn't exist, it's created with the specified ID (upsert behavior)
- All operations are performed within a database transaction for atomicity
- Reference resolution works across all operations within the bundle
- Error handling includes specific messages for common validation failures
