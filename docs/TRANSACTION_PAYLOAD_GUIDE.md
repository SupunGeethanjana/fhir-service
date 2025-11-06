# FHIR Transaction Bundle - Sample Payloads Guide

## Overview

This document provides comprehensive sample payloads for testing all CRUD operations (POST, PUT, PATCH, DELETE) in FHIR transaction bundles. Each example demonstrates real-world scenarios and best practices.

## Payload Categories

### 1. Complete CRUD Transaction Bundle
**File Reference:** `complete_crud_transaction_bundle`

**Description:** Demonstrates all four HTTP methods in a single transaction bundle.

**Operations Included:**
- **POST**: Create new Patient and Observation with reference resolution
- **PUT**: Upsert Patient and Observation with specific IDs
- **PATCH**: Partial updates to Patient contact info and Observation values
- **DELETE**: Remove obsolete Observation and cancelled Appointment

**Key Features:**
- Reference resolution between resources (`urn:uuid:patient-create-1`)
- Smart duplicate detection for Patient resources
- Intelligent field merging in PATCH operations
- Atomic transaction processing

---

### 2. POST Operations Only
**File Reference:** `post_operations_only`

**Description:** Focuses on CREATE operations with smart duplicate detection.

**Scenarios Demonstrated:**
- Creating new Patient with unique identifiers
- Duplicate Patient detection and merging
- Creating related Encounter with patient reference

**Smart Features:**
- Duplicate detection based on Patient identifiers
- Automatic merging of additional information
- Reference resolution within bundle

---

### 3. PUT Operations Only
**File Reference:** `put_operations_only`

**Description:** Demonstrates upsert behavior for complete resource replacement.

**Scenarios Demonstrated:**
- Creating new Patient with specific ID (if doesn't exist)
- Updating existing Practitioner with complete replacement
- Upsert behavior validation

**Key Behaviors:**
- Creates resource if ID doesn't exist
- Completely replaces resource if ID exists
- Returns appropriate HTTP status codes (200/201)

---

### 4. PATCH Operations Only
**File Reference:** `patch_operations_only`

**Description:** Shows partial updates with intelligent field merging.

**Scenarios Demonstrated:**
- Updating Patient contact information
- Correcting Observation values with notes
- Modifying Appointment status and cancellation reason

**Smart Merging Features:**
- Preserves existing data while adding new fields
- Intelligent array merging for contact info
- Deep object merging for complex structures

---

### 5. DELETE Operations Only
**File Reference:** `delete_operations_only`

**Description:** Demonstrates safe resource removal.

**Scenarios Demonstrated:**
- Removing obsolete Observations
- Deleting cancelled Appointments
- Cleaning up resolved Conditions

**Safety Features:**
- Existence validation before deletion
- Returns HTTP 204 (No Content) on success
- Clear error messages for missing resources

---

### 6. Patient Smart Merging Scenario
**File Reference:** `patient_smart_merging_scenario`

**Description:** Detailed example of Patient duplicate detection and intelligent merging.

**Features Demonstrated:**
- Multiple identifiers for robust matching
- Additional names (maiden name)
- Multiple contact methods and addresses
- Emergency contact information

**Merging Logic:**
- Additive-only merging (never removes existing data)
- Intelligent deduplication of contact info
- Preservation of all patient information

---

### 7. Complex Clinical Workflow
**File Reference:** `complex_clinical_workflow`

**Description:** Real-world clinical scenario with mixed operations.

**Workflow Steps:**
1. **POST**: Create new Patient
2. **POST**: Create Encounter for patient admission
3. **PUT**: Update Condition status (resolved)
4. **PATCH**: Update vital signs with notes
5. **DELETE**: Remove discontinued medication

**Clinical Context:**
- Patient admission and treatment
- Condition resolution tracking
- Medication management
- Vital signs monitoring

## Usage Instructions

### Testing Individual Operations

1. **POST Operation Testing:**
   ```bash
   curl -X POST http://your-fhir-server/Bundle \
     -H "Content-Type: application/json" \
     -d @post_operations_only.json
   ```

2. **PUT Operation Testing:**
   ```bash
   curl -X POST http://your-fhir-server/Bundle \
     -H "Content-Type: application/json" \
     -d @put_operations_only.json
   ```

3. **PATCH Operation Testing:**
   ```bash
   curl -X POST http://your-fhir-server/Bundle \
     -H "Content-Type: application/json" \
     -d @patch_operations_only.json
   ```

4. **DELETE Operation Testing:**
   ```bash
   curl -X POST http://your-fhir-server/Bundle \
     -H "Content-Type: application/json" \
     -d @delete_operations_only.json
   ```

### Expected Response Format

All transaction bundles return a `transaction-response` Bundle:

```json
{
  "resourceType": "Bundle",
  "type": "transaction-response",
  "entry": [
    {
      "response": {
        "status": "201 Created",
        "location": "Patient/patient-id/_history/1"
      }
    },
    {
      "response": {
        "status": "200 OK",
        "location": "Patient/patient-id/_history/2"
      }
    },
    {
      "response": {
        "status": "204 No Content"
      }
    }
  ]
}
```

## Response Status Codes

| Operation | Success Status | Location Header | Description |
|-----------|---------------|----------------|-------------|
| POST (Create) | 201 Created | Yes | New resource created |
| POST (Duplicate) | 200 OK | Yes | Existing resource returned/updated |
| PUT (Update) | 200 OK | Yes | Resource updated |
| PUT (Create) | 201 Created | Yes | Resource created via upsert |
| PATCH | 200 OK | Yes | Resource partially updated |
| DELETE | 204 No Content | No | Resource successfully deleted |

## Error Scenarios

### Common Error Responses

1. **Resource Not Found (PATCH/DELETE):**
   ```json
   {
     "resourceType": "OperationOutcome",
     "issue": [
       {
         "severity": "error",
         "code": "not-found",
         "details": {
           "text": "Resource Patient/invalid-id not found for PATCH operation"
         }
       }
     ]
   }
   ```

2. **Invalid Request URL:**
   ```json
   {
     "resourceType": "OperationOutcome",
     "issue": [
       {
         "severity": "error",
         "code": "invalid",
         "details": {
           "text": "Invalid PATCH request URL: InvalidURL. Expected format: Patient/[id]"
         }
       }
     ]
   }
   ```

3. **Resource Type Mismatch:**
   ```json
   {
     "resourceType": "OperationOutcome",
     "issue": [
       {
         "severity": "error",
         "code": "invalid",
         "details": {
           "text": "Resource type mismatch: URL contains 'Observation' but resource is 'Patient'"
         }
       }
     ]
   }
   ```

## Best Practices

### 1. Resource References
- Use `urn:uuid:` format for temporary references within bundles
- Ensure all referenced resources are included in the same bundle
- Use proper FHIR reference format: `ResourceType/id`

### 2. Patient Duplicate Detection
- Always include meaningful identifiers (system + value)
- Use consistent identifier systems across your organization
- Provide comprehensive patient information for better merging

### 3. PATCH Operations
- Only include fields you want to update
- Use intelligent merging for arrays (identifiers, contact info)
- Preserve existing data when adding new information

### 4. Error Handling
- Validate resource IDs before PATCH/DELETE operations
- Handle transaction rollback scenarios
- Provide meaningful error messages

### 5. Performance Considerations
- Batch related operations in single transactions
- Use appropriate HTTP methods for the intended operation
- Monitor transaction size and complexity

## Testing Strategy

### 1. Unit Testing
- Test each operation type individually
- Validate response formats and status codes
- Test error scenarios and edge cases

### 2. Integration Testing
- Test mixed operation bundles
- Validate reference resolution
- Test transaction rollback scenarios

### 3. Performance Testing
- Large bundle processing
- Concurrent transaction handling
- Database performance under load

### 4. Clinical Workflow Testing
- End-to-end patient care scenarios
- Multi-step clinical processes
- Cross-departmental data sharing

## Customization Guidelines

### Adding New Resource Types
1. Update the transaction service to include new resource services
2. Add appropriate duplicate detection logic if needed
3. Create sample payloads for the new resource types
4. Update documentation and test cases

### Extending Duplicate Detection
1. Implement resource-specific duplicate keys
2. Add intelligent merging logic for new resource types
3. Update the `checkForDuplicates` method
4. Create test scenarios for duplicate detection

### Custom Field Merging
1. Extend the PATCH merging logic for specific fields
2. Add field-specific merging strategies
3. Update the `mergePatchArrayField` method
4. Test complex merging scenarios

This comprehensive guide provides everything needed to test and implement FHIR transaction bundles with full CRUD support.
