# GraphQL Query Examples for FHIR Patient Data

## 1. Basic Patient Data Query by MRN

```graphql
query GetPatientByMrn($mrn: String!, $system: String) {
  patientByMrn(mrn: $mrn, system: $system) {
    patient {
      id
      resourceType
      resource
      versionId
      lastUpdated
      txid
    }
    encounters {
      id
      resource
      lastUpdated
    }
    conditions {
      id
      resource
      lastUpdated
    }
    observations {
      id
      resource
      lastUpdated
    }
    allergies {
      id
      resource
      lastUpdated
    }
    medications {
      id
      resource
      lastUpdated
    }
    procedures {
      id
      resource
      lastUpdated
    }
    familyHistory {
      id
      resource
      lastUpdated
    }
    diagnosticReports {
      id
      resource
      lastUpdated
    }
    medicationRequests {
      id
      resource
      lastUpdated
    }
    serviceRequests {
      id
      resource
      lastUpdated
    }
    appointments {
      id
      resource
      lastUpdated
    }
    compositions {
      id
      resource
      lastUpdated
    }
  }
}
```

### Variables:
```json
{
  "mrn": "000000002",
  "system": "http://myhospital.org/mrn"
}
```

## 2. Minimal Patient Data Query (Just patient and conditions)

```graphql
query GetPatientConditions($mrn: String!) {
  patientByMrn(mrn: $mrn) {
    patient {
      id
      resource
    }
    conditions {
      id
      resource
      lastUpdated
    }
  }
}
```

### Variables:
```json
{
  "mrn": "000000002"
}
```

## 3. Patient Clinical Summary Query

```graphql
query GetPatientClinicalSummary($mrn: String!) {
  patientByMrn(mrn: $mrn) {
    patient {
      id
      resource
      lastUpdated
    }
    encounters {
      id
      resource
      lastUpdated
    }
    conditions {
      id
      resource
      lastUpdated
    }
    observations {
      id
      resource
      lastUpdated
    }
    allergies {
      id
      resource
      lastUpdated
    }
    medications {
      id
      resource
      lastUpdated
    }
    medicationRequests {
      id
      resource
      lastUpdated
    }
    compositions {
      id
      resource
      lastUpdated
    }
  }
}
```

## 4. Fragment-based Query for Reusability

```graphql
fragment ResourceBasic on FhirResourceType {
  id
  resourceType
  resource
  lastUpdated
  versionId
}

query GetPatientDataWithFragments($mrn: String!) {
  patientByMrn(mrn: $mrn) {
    patient {
      ...ResourceBasic
    }
    encounters {
      ...ResourceBasic
    }
    conditions {
      ...ResourceBasic
    }
    observations {
      ...ResourceBasic
    }
    allergies {
      ...ResourceBasic
    }
    medications {
      ...ResourceBasic
    }
    procedures {
      ...ResourceBasic
    }
    familyHistory {
      ...ResourceBasic
    }
    diagnosticReports {
      ...ResourceBasic
    }
    medicationRequests {
      ...ResourceBasic
    }
    serviceRequests {
      ...ResourceBasic
    }
    appointments {
      ...ResourceBasic
    }
    compositions {
      ...ResourceBasic
    }
  }
}
```

## Usage Instructions

1. **Start the FHIR service** with GraphQL enabled
2. **Access GraphQL Playground** at `http://localhost:3000/graphql`
3. **First, submit your transaction bundle** using the REST API to create the patient data
4. **Then use the GraphQL queries** to retrieve the comprehensive patient data

### Sample Transaction Bundle Submission (REST API):
```bash
POST http://localhost:3000/Bundle
Content-Type: application/json

{
  "resourceType": "Bundle",
  "type": "transaction",
  "entry": [
    // ... your transaction bundle entries here
  ]
}
```

### Sample GraphQL Query Execution:
```bash
POST http://localhost:3000/graphql
Content-Type: application/json

{
  "query": "query GetPatientByMrn($mrn: String!) { patientByMrn(mrn: $mrn) { patient { id resource } conditions { id resource } } }",
  "variables": {
    "mrn": "000000002"
  }
}
```

## Expected Response Structure

The GraphQL response will contain the patient and all related FHIR resources:

```json
{
  "data": {
    "patientByMrn": {
      "patient": {
        "id": "patient-uuid",
        "resourceType": "Patient",
        "resource": {
          // Full FHIR Patient resource JSON
        },
        "lastUpdated": "2025-07-22T09:00:00Z"
      },
      "encounters": [
        {
          "id": "encounter-uuid",
          "resource": {
            // Full FHIR Encounter resource JSON
          },
          "lastUpdated": "2025-07-22T09:00:00Z"
        }
      ],
      "conditions": [
        {
          "id": "condition-uuid",
          "resource": {
            // Full FHIR Condition resource JSON
          },
          "lastUpdated": "2025-07-22T09:00:00Z"
        }
      ],
      // ... other resource arrays
    }
  }
}
```

## Error Handling

If the patient is not found:
```json
{
  "errors": [
    {
      "message": "Patient with MRN 000000002 not found",
      "path": ["patientByMrn"]
    }
  ],
  "data": null
}
```
