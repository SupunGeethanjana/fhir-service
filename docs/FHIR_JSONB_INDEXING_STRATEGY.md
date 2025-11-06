# FHIR Resource JSONB Indexing Strategy

## Overview
This document outlines the indexing strategy for FHIR resource JSONB columns in PostgreSQL, addressing the limitations of GIN indexes on large JSONB columns and providing alternative approaches for optimal query performance.

## Current Implementation

### Schema Design
- **Resource Storage**: Each FHIR resource is stored as a JSONB column in dedicated tables
- **Search Parameters**: Metadata-driven search using the `fhir_search_params` table
- **Expression-Based Queries**: Dynamic JSONB path expressions for flexible searching

### Current Indexes
```sql
-- Standard indexes (working well)
CREATE INDEX idx_patient_id ON fhir.patient (id);
CREATE INDEX idx_patient_txid ON fhir.patient (txid);
CREATE INDEX idx_patient_last_updated ON fhir.patient (last_updated);
CREATE INDEX idx_patient_version_id ON fhir.patient (version_id);

-- Removed due to PostgreSQL row size limitations
-- CREATE INDEX idx_patient_resource_gin ON fhir.patient USING GIN(resource);
```

## Indexing Challenges

### PostgreSQL Index Row Size Limitation
- PostgreSQL has an 8KB limit on index row size
- Large FHIR resources can exceed this limit when using GIN indexes
- Error: "index row requires 8280 bytes, maximum size is 8191"

### GIN Index Limitations
- **Storage overhead**: GIN indexes can be 2-3x the size of the data
- **Update performance**: Slower INSERT/UPDATE operations
- **Memory usage**: High memory consumption for large datasets

## Alternative Indexing Strategies

### 1. Functional Indexes on Specific JSONB Paths

Create indexes on frequently queried JSONB paths:

```sql
-- Patient search indexes
CREATE INDEX idx_patient_family_name ON fhir.patient 
USING btree ((resource -> 'name' -> 0 ->> 'family'));

CREATE INDEX idx_patient_given_name ON fhir.patient 
USING btree ((resource -> 'name' -> 0 ->> 'given'));

CREATE INDEX idx_patient_birthdate ON fhir.patient 
USING btree ((resource ->> 'birthDate'));

CREATE INDEX idx_patient_gender ON fhir.patient 
USING btree ((resource ->> 'gender'));

-- Observation search indexes
CREATE INDEX idx_observation_code ON fhir.observation 
USING btree ((resource -> 'code' -> 'coding' -> 0 ->> 'code'));

CREATE INDEX idx_observation_date ON fhir.observation 
USING btree (((resource ->> 'effectiveDateTime')::date));

CREATE INDEX idx_observation_subject ON fhir.observation 
USING btree ((resource -> 'subject' ->> 'reference'));

-- Condition search indexes
CREATE INDEX idx_condition_code ON fhir.condition 
USING btree ((resource -> 'code' -> 'coding' -> 0 ->> 'code'));

CREATE INDEX idx_condition_subject ON fhir.condition 
USING btree ((resource -> 'subject' ->> 'reference'));
```

**Advantages:**
- Smaller index size
- Faster queries on indexed paths
- Lower maintenance overhead
- No row size limitations

**Disadvantages:**
- Requires anticipating query patterns
- One index per search path
- May not cover all use cases

### 2. Partial GIN Indexes

Create GIN indexes on smaller JSONB subsets:

```sql
-- Index only specific sections of the resource
CREATE INDEX idx_patient_name_gin ON fhir.patient 
USING GIN((resource -> 'name'));

CREATE INDEX idx_patient_identifier_gin ON fhir.patient 
USING GIN((resource -> 'identifier'));

CREATE INDEX idx_observation_code_gin ON fhir.observation 
USING GIN((resource -> 'code'));
```

**Advantages:**
- Flexible querying within indexed sections
- Smaller than full resource GIN indexes
- Good for complex nested searches

**Disadvantages:**
- Still has size limitations for large sections
- Multiple indexes needed for comprehensive coverage

### 3. Text Search Indexes

Use PostgreSQL's full-text search capabilities:

```sql
-- Create searchable text from JSONB
CREATE INDEX idx_patient_search_text ON fhir.patient 
USING GIN(to_tsvector('english', resource::text));

-- Or create a dedicated search column
ALTER TABLE fhir.patient ADD COLUMN search_text tsvector;

CREATE OR REPLACE FUNCTION update_patient_search_text()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_text := to_tsvector('english', 
        COALESCE(NEW.resource ->> 'name', '') || ' ' ||
        COALESCE(NEW.resource ->> 'identifier', '') || ' ' ||
        COALESCE(NEW.resource ->> 'birthDate', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_patient_search_text
    BEFORE INSERT OR UPDATE ON fhir.patient
    FOR EACH ROW EXECUTE FUNCTION update_patient_search_text();
```

**Advantages:**
- Excellent for text-based searches
- Supports complex text queries
- Language-aware searching

**Disadvantages:**
- Limited to text search scenarios
- Requires preprocessing
- Less precise than structured searches

### 4. External Search Engine Integration

Integrate with dedicated search engines:

```typescript
// Example: Elasticsearch integration
export class ElasticsearchService {
    async indexResource(resourceType: string, resource: any) {
        await this.elasticClient.index({
            index: `fhir-${resourceType.toLowerCase()}`,
            id: resource.id,
            body: resource
        });
    }

    async search(resourceType: string, query: any) {
        return await this.elasticClient.search({
            index: `fhir-${resourceType.toLowerCase()}`,
            body: { query }
        });
    }
}
```

**Advantages:**
- Designed for complex searches
- Excellent performance at scale
- Advanced search features
- No size limitations

**Disadvantages:**
- Additional infrastructure complexity
- Data synchronization challenges
- Higher operational overhead

## Recommended Implementation Strategy

### Phase 1: Functional Indexes (Immediate)
Implement functional indexes for the most common search parameters:

```sql
-- High-priority functional indexes based on search parameters
-- Patient
CREATE INDEX idx_patient_family_name ON fhir.patient 
USING btree ((resource -> 'name' -> 0 ->> 'family'));

CREATE INDEX idx_patient_identifier_value ON fhir.patient 
USING btree ((resource -> 'identifier' -> 0 ->> 'value'));

-- Observation  
CREATE INDEX idx_observation_code ON fhir.observation 
USING btree ((resource -> 'code' -> 'coding' -> 0 ->> 'code'));

CREATE INDEX idx_observation_subject_ref ON fhir.observation 
USING btree ((resource -> 'subject' ->> 'reference'));

-- Encounter
CREATE INDEX idx_encounter_subject_ref ON fhir.encounter 
USING btree ((resource -> 'subject' ->> 'reference'));

CREATE INDEX idx_encounter_status ON fhir.encounter 
USING btree ((resource ->> 'status'));
```

### Phase 2: Selective Partial GIN Indexes
Add GIN indexes for specific JSONB sections that are frequently searched but don't create large rows:

```sql
-- Small, focused GIN indexes
CREATE INDEX idx_patient_telecom_gin ON fhir.patient 
USING GIN((resource -> 'telecom'));

CREATE INDEX idx_observation_component_gin ON fhir.observation 
USING GIN((resource -> 'component'));
```

### Phase 3: Query Optimization
Optimize the GenericSearchService to use the most appropriate indexes:

```typescript
// Enhanced search parameter application
private applyOptimizedSearch(queryBuilder: any, searchParamDef: FhirSearchParameter, value: string) {
    const { expression, type, name, resourceType } = searchParamDef;
    
    // Use functional indexes when available
    if (this.hasFunctionalIndex(resourceType, name)) {
        this.applyFunctionalIndexSearch(queryBuilder, searchParamDef, value);
    } else {
        // Fallback to expression-based search
        this.applyStandardSearch(queryBuilder, searchParamDef, value);
    }
}
```

### Phase 4: Monitoring and Analytics
Implement query performance monitoring:

```typescript
export class SearchPerformanceService {
    async logSearchPerformance(
        resourceType: string,
        searchParams: any,
        duration: number,
        resultCount: number
    ) {
        // Log slow queries for optimization
        if (duration > 1000) { // > 1 second
            this.logger.warn('Slow search query detected', {
                resourceType,
                searchParams,
                duration,
                resultCount
            });
        }
    }
}
```

## Performance Considerations

### Index Maintenance
- **Concurrent creation**: Use `CREATE INDEX CONCURRENTLY` for production
- **Index monitoring**: Track index usage and bloat
- **Selective indexing**: Only index frequently used search paths

### Query Patterns
- **Compound searches**: Consider composite indexes for common parameter combinations
- **Reference chains**: Optimize chained searches with appropriate joins
- **Pagination**: Ensure efficient OFFSET/LIMIT performance

### Storage Optimization
- **JSONB compression**: PostgreSQL automatically compresses JSONB
- **Column selection**: Only select needed columns in queries
- **Result caching**: Implement caching for expensive searches

## Migration Scripts

### Add Functional Indexes
```sql
-- Add functional indexes for common search parameters
\timing

-- Patient indexes
CREATE INDEX CONCURRENTLY idx_patient_family_name 
ON fhir.patient USING btree ((resource -> 'name' -> 0 ->> 'family'));

CREATE INDEX CONCURRENTLY idx_patient_given_name 
ON fhir.patient USING btree ((resource -> 'name' -> 0 ->> 'given'));

CREATE INDEX CONCURRENTLY idx_patient_birthdate 
ON fhir.patient USING btree ((resource ->> 'birthDate'));

-- Add similar indexes for other resources...

-- Analyze tables after index creation
ANALYZE fhir.patient;
ANALYZE fhir.observation;
-- etc.
```

### Query Performance Testing
```sql
-- Test query performance before and after indexing
EXPLAIN (ANALYZE, BUFFERS) 
SELECT resource FROM fhir.patient 
WHERE resource -> 'name' -> 0 ->> 'family' = 'Smith';

-- Check index usage
SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch 
FROM pg_stat_user_indexes 
WHERE tablename LIKE '%patient%';
```

## Conclusion

The recommended approach is a hybrid strategy that:

1. **Uses functional indexes** for common, specific search paths
2. **Implements selective partial GIN indexes** for complex nested searches
3. **Maintains expression-based fallbacks** for comprehensive coverage
4. **Monitors performance** to guide future optimizations

This strategy provides the best balance of performance, maintainability, and flexibility while avoiding the limitations of full JSONB GIN indexes on large resources.

## Next Steps

1. **Implement Phase 1 functional indexes** for high-priority search parameters
2. **Update GenericSearchService** to leverage new indexes
3. **Add performance monitoring** to identify optimization opportunities
4. **Consider external search integration** for advanced use cases
5. **Regular index maintenance** and performance tuning
