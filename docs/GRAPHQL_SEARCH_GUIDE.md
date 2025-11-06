# Enhanced GraphQL Search Queries for FHIR

## Overview

GraphQL provides significant advantages over REST for FHIR search operations:

- **Single Request**: Get patient and related clinical data in one query
- **Flexible Selection**: Choose exactly which fields you need
- **Reduced Network Overhead**: Fewer HTTP requests
- **Better Performance**: Optimized queries and batching

## Search Examples

### 1. Basic Patient Search (equivalent to REST `GET /Patient?family=Al-Zahra`)

```graphql
query SearchPatientsByFamily {
  searchPatients(search: {
    family: "Al-Zahra"
    limit: 10
  }) {
    patients {
      id
      resource
      lastUpdated
    }
    total
    hasMore
  }
}
```

### 2. Advanced Patient Search with Multiple Parameters

```graphql
query AdvancedPatientSearch {
  searchPatients(search: {
    family: "Al-Zahra"
    given: "Ahmed"
    gender: "male"
    limit: 20
    offset: 0
  }) {
    patients {
      id
      resource {
        # Access specific FHIR resource fields
        name
        birthDate
        gender
        identifier
      }
      lastUpdated
      versionId
    }
    total
    hasMore
  }
}
```

### 3. Comprehensive Patient Data (Patient + Related Resources)

**This is where GraphQL really shines** - equivalent to multiple REST calls:

```graphql
query PatientWithClinicalData {
  searchPatientsWithClinicalData(search: {
    family: "Al-Zahra"
    limit: 5
  }) {
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
  }
}
```

### 4. Practitioner Search

```graphql
query SearchPractitioners {
  searchPractitioners(
    name: "Smith"
    limit: 10
  ) {
    id
    resource
    lastUpdated
  }
}
```

### 5. Selective Field Retrieval (Performance Optimization)

```graphql
query PatientBasicInfo {
  searchPatients(search: {
    family: "Al-Zahra"
  }) {
    patients {
      id
      # Only get the fields you need
      resource {
        name
        birthDate
        gender
      }
    }
    total
  }
}
```

## REST vs GraphQL Comparison

### REST Approach (Multiple Requests)
```bash
# 1. Search for patients
GET /fhir-service/Patient?family=Al-Zahra

# 2. For each patient, get related data (N additional requests)
GET /fhir-service/Encounter?patient={patientId}
GET /fhir-service/Condition?patient={patientId}
GET /fhir-service/Observation?patient={patientId}
```

### GraphQL Approach (Single Request)
```graphql
query {
  searchPatientsWithClinicalData(search: { family: "Al-Zahra" }) {
    patient { id, resource }
    encounters { id, resource }
    conditions { id, resource }
    observations { id, resource }
  }
}
```

## Usage Guidelines

### When to Use GraphQL Search:
- ✅ **Complex queries** requiring multiple related resources
- ✅ **Mobile applications** with limited bandwidth
- ✅ **Frontend applications** that need specific data shapes
- ✅ **Dashboard/analytics** requiring aggregated data
- ✅ **Performance-critical** applications

### When to Use REST Search:
- ✅ **Simple single-resource** queries
- ✅ **FHIR compliance** requirements (official FHIR spec)
- ✅ **Third-party integrations** expecting standard FHIR REST
- ✅ **Caching strategies** based on HTTP semantics

## Performance Benefits

1. **Reduced Network Latency**: 1 request instead of N+1
2. **Bandwidth Optimization**: Only requested fields are returned
3. **Server Efficiency**: Batched database queries
4. **Client Simplicity**: Single data fetching pattern

## Testing Your GraphQL Endpoint

## Comprehensive Search Examples

### 5. Complete Patient Clinical Profile (All Resources)

The `comprehensiveSearchEnhanced` query allows you to retrieve a patient and ALL their related clinical data in a single request:

```graphql
query CompletePatientProfile($family: String!) {
  comprehensiveSearchEnhanced(family: $family, includeTimeline: true, limit: 5) {
    patient {
      id
      resource
      lastUpdated
    }
    
    # Clinical encounters
    encounters {
      id
      resource
      lastUpdated
    }
    totalEncounters
    
    # Conditions and diagnoses
    conditions {
      id
      resource
      lastUpdated
    }
    totalConditions
    
    # Laboratory results and vital signs
    observations {
      id
      resource
      lastUpdated
    }
    totalObservations
    
    # Allergies and intolerances
    allergies {
      id
      resource
      lastUpdated
    }
    totalAllergies
    
    # Procedures performed
    procedures {
      id
      resource
      lastUpdated
    }
    totalProcedures
    
    # Diagnostic reports (imaging, lab reports, etc.)
    diagnosticReports {
      id
      resource
      lastUpdated
    }
    totalDiagnosticReports
    
    # Service requests (orders)
    serviceRequests {
      id
      resource
      lastUpdated
    }
    totalServiceRequests
    
    # Medication prescriptions
    medicationRequests {
      id
      resource
      lastUpdated
    }
    totalMedicationRequests
    
    # Medication administration records
    medicationStatements {
      id
      resource
      lastUpdated
    }
    totalMedicationStatements
    
    # Family medical history
    familyHistory {
      id
      resource
      lastUpdated
    }
    totalFamilyHistory
    
    # Scheduled appointments
    appointments {
      id
      resource
      lastUpdated
    }
    totalAppointments
    
    # Clinical documents and notes
    compositions {
      id
      resource
      lastUpdated
    }
    totalCompositions
  }
}
```

### 6. Comprehensive Search with Date Filtering

```graphql
query PatientDataWithinDateRange($family: String!, $startDate: String!, $endDate: String!) {
  comprehensiveSearchEnhanced(
    family: $family, 
    includeTimeline: true,
    dateRange: {
      start: $startDate,
      end: $endDate
    },
    limit: 3
  ) {
    patient {
      id
      resource
    }
    
    # Only get recent clinical data
    encounters {
      id
      resource
    }
    conditions {
      id
      resource
    }
    observations {
      id
      resource
    }
    medicationRequests {
      id
      resource
    }
    appointments {
      id
      resource
    }
    
    # Get totals for pagination
    totalEncounters
    totalConditions
    totalObservations
    totalMedicationRequests
    totalAppointments
  }
}
```

### 7. Minimal Comprehensive Search (Statistics Only)

If you only need counts without full resource data:

```graphql
query PatientClinicalSummary($family: String!) {
  comprehensiveSearchEnhanced(family: $family, limit: 10) {
    patient {
      id
      resource {
        name
        birthDate
        gender
      }
    }
    
    # Just get the totals for a quick overview
    totalEncounters
    totalConditions
    totalObservations
    totalAllergies
    totalProcedures
    totalDiagnosticReports
    totalServiceRequests
    totalMedicationRequests
    totalMedicationStatements
    totalFamilyHistory
    totalAppointments
    totalCompositions
  }
}
```

## Resource Coverage

The enhanced GraphQL search now covers ALL FHIR resources available in the system:

| Resource Type | Description | Example Use Case |
|---------------|-------------|------------------|
| **Patient** | Demographics and identifiers | Core patient information |
| **Encounter** | Healthcare visits/episodes | Hospital admissions, outpatient visits |
| **Condition** | Diagnoses and problems | Active diagnoses, past medical history |
| **Observation** | Measurements and assessments | Lab results, vital signs, clinical notes |
| **AllergyIntolerance** | Allergic reactions and intolerances | Drug allergies, food sensitivities |
| **Procedure** | Clinical procedures performed | Surgeries, treatments, interventions |
| **DiagnosticReport** | Diagnostic study results | Radiology reports, pathology results |
| **ServiceRequest** | Orders and referrals | Lab orders, referrals to specialists |
| **MedicationRequest** | Medication prescriptions | Active prescriptions, medication orders |
| **MedicationStatement** | Medication usage records | Patient-reported medications |
| **FamilyMemberHistory** | Family medical history | Genetic predispositions, family conditions |
| **Appointment** | Scheduled healthcare events | Future appointments, scheduling |
| **Composition** | Clinical documents | Discharge summaries, clinical notes |
| **Practitioner** | Healthcare providers | Doctors, nurses, specialists |

Access the GraphQL Playground at:
```
http://localhost:3300/fhir-service/graphql
```

## Example Variables

```json
{
  "search": {
    "family": "Al-Zahra",
    "limit": 10,
    "offset": 0
  }
}
```

## Conclusion

For your specific use case (`Patient?family=Al-Zahra`), GraphQL provides significant advantages when you need related clinical data. Use GraphQL for complex queries and REST for simple, standards-compliant FHIR operations.

The enhanced `comprehensiveSearchEnhanced` query is particularly powerful as it allows you to retrieve a complete patient clinical profile including all 14 FHIR resource types in a single request, significantly reducing network overhead and improving application performance.
