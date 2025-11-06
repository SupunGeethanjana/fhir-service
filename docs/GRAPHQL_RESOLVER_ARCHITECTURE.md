/**
 * GraphQL Resolver Architecture Recommendation
 * 
 * RECOMMENDED: Keep separate resolvers for better maintainability
 */

// ✅ KEEP THIS STRUCTURE:

/**
 * PatientDataResolver
 * Purpose: Comprehensive patient data aggregation by known identifiers
 * Use cases:
 * - Getting full patient record by MRN
 * - Patient dashboard data
 * - Clinical summaries
 */
export class PatientDataResolver {
    @Query(() => PatientDataType)
    patientByMrn(mrn: string, system?: string): Promise<PatientDataType>
    
    @Query(() => [PatientDataType])
    patientsByMrns(mrns: string[], system?: string): Promise<PatientDataType[]>
}

/**
 * FhirSearchResolver  
 * Purpose: Flexible FHIR resource searching and discovery
 * Use cases:
 * - Finding patients by demographics
 * - Searching practitioners
 * - Clinical research queries
 * - Advanced filtering
 */
export class FhirSearchResolver {
    @Query(() => [PatientType])
    searchPatients(searchInput: FhirSearchInput): Promise<PatientType[]>
    
    @Query(() => [PractitionerType])  
    searchPractitioners(name?: string, identifier?: string): Promise<PractitionerType[]>
    
    @Query(() => [ComprehensiveSearchResult])
    comprehensiveSearch(family: string): Promise<ComprehensiveSearchResult[]>
}

// ❌ DON'T MERGE INTO ONE:
// export class FhirResolver {
//   // This would become too large and violate SRP
// }

/**
 * ALTERNATIVE: Domain-Based Resolver Architecture (Future Consideration)
 * 
 * If your API grows significantly, you could consider domain-based resolvers:
 */

// Option 1: Keep current (RECOMMENDED for now)
PatientDataResolver + FhirSearchResolver

// Option 2: Domain-based (Consider if API grows large)
PatientResolver {
  // All patient-related queries
  patientByMrn()
  searchPatients() 
  patientObservations()
}

PractitionerResolver {
  // All practitioner-related queries
  practitionerById()
  searchPractitioners()
  practitionerSchedule()
}

ClinicalDataResolver {
  // Cross-resource clinical queries
  comprehensiveSearch()
  clinicalTimeline()
}

/**
 * DECISION MATRIX:
 * 
 * Current Size: Small-Medium ✅ Keep 2 resolvers
 * Future Large:  ✅ Consider domain-based
 * Very Complex:  ✅ Consider CQRS pattern
 */

/**
 * PERFORMANCE CONSIDERATIONS:
 * 
 * ✅ Separate resolvers allow:
 * - Different caching strategies
 * - Resource-specific optimizations  
 * - Independent scaling
 * - Clearer monitoring/metrics
 */
