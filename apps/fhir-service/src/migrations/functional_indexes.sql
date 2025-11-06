-- ===================================================================
-- FHIR Functional Indexes Migration
-- ===================================================================
-- 
-- This migration adds functional indexes for common FHIR search parameters
-- to improve query performance without the size limitations of GIN indexes
-- on large JSONB columns.
--
-- Run with: psql -d fhir_db -f functional_indexes.sql
-- 
-- ===================================================================

\timing

-- Start transaction for atomic migration
BEGIN;

-- ===================================================================
-- Patient Functional Indexes
-- ===================================================================

-- Family name search (most common patient search)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patient_family_name 
ON fhir.patient USING btree ((resource -> 'name' -> 0 ->> 'family'));

-- Given name search  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patient_given_name 
ON fhir.patient USING btree ((resource -> 'name' -> 0 ->> 'given'));

-- Birth date search (often used for patient matching)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patient_birthdate 
ON fhir.patient USING btree ((resource ->> 'birthDate'));

-- Gender search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patient_gender 
ON fhir.patient USING btree ((resource ->> 'gender'));

-- Active status search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patient_active 
ON fhir.patient USING btree ((resource ->> 'active'));

-- Primary identifier value (MRN, SSN, etc.)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patient_identifier_value 
ON fhir.patient USING btree ((resource -> 'identifier' -> 0 ->> 'value'));

-- Primary identifier system
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patient_identifier_system 
ON fhir.patient USING btree ((resource -> 'identifier' -> 0 ->> 'system'));

-- ===================================================================
-- Observation Functional Indexes  
-- ===================================================================

-- Observation code (LOINC, SNOMED, etc.)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_observation_code 
ON fhir.observation USING btree ((resource -> 'code' -> 'coding' -> 0 ->> 'code'));

-- Observation code system
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_observation_code_system 
ON fhir.observation USING btree ((resource -> 'code' -> 'coding' -> 0 ->> 'system'));

-- Effective date/time (most common temporal search)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_observation_effective_date 
ON fhir.observation USING btree (((resource ->> 'effectiveDateTime')::timestamp));

-- Subject reference (link to patient)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_observation_subject_ref 
ON fhir.observation USING btree ((resource -> 'subject' ->> 'reference'));

-- Observation status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_observation_status 
ON fhir.observation USING btree ((resource ->> 'status'));

-- Category code (lab, vital-signs, etc.)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_observation_category 
ON fhir.observation USING btree ((resource -> 'category' -> 0 -> 'coding' -> 0 ->> 'code'));

-- ===================================================================
-- Condition Functional Indexes
-- ===================================================================

-- Condition code (ICD-10, SNOMED, etc.)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_condition_code 
ON fhir.condition USING btree ((resource -> 'code' -> 'coding' -> 0 ->> 'code'));

-- Subject reference
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_condition_subject_ref 
ON fhir.condition USING btree ((resource -> 'subject' ->> 'reference'));

-- Clinical status (active, inactive, resolved, etc.)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_condition_clinical_status 
ON fhir.condition USING btree ((resource -> 'clinicalStatus' -> 'coding' -> 0 ->> 'code'));

-- Verification status (confirmed, provisional, etc.)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_condition_verification_status 
ON fhir.condition USING btree ((resource -> 'verificationStatus' -> 'coding' -> 0 ->> 'code'));

-- Onset date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_condition_onset_date 
ON fhir.condition USING btree (((resource ->> 'onsetDateTime')::timestamp));

-- ===================================================================
-- Encounter Functional Indexes
-- ===================================================================

-- Subject reference
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_encounter_subject_ref 
ON fhir.encounter USING btree ((resource -> 'subject' ->> 'reference'));

-- Encounter status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_encounter_status 
ON fhir.encounter USING btree ((resource ->> 'status'));

-- Encounter class (inpatient, outpatient, emergency, etc.)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_encounter_class 
ON fhir.encounter USING btree ((resource -> 'class' ->> 'code'));

-- Period start (admission/visit date)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_encounter_period_start 
ON fhir.encounter USING btree (((resource -> 'period' ->> 'start')::timestamp));

-- Period end (discharge date)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_encounter_period_end 
ON fhir.encounter USING btree (((resource -> 'period' ->> 'end')::timestamp));

-- ===================================================================
-- Procedure Functional Indexes
-- ===================================================================

-- Procedure code (CPT, SNOMED, etc.)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_procedure_code 
ON fhir.procedure USING btree ((resource -> 'code' -> 'coding' -> 0 ->> 'code'));

-- Subject reference
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_procedure_subject_ref 
ON fhir.procedure USING btree ((resource -> 'subject' ->> 'reference'));

-- Procedure status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_procedure_status 
ON fhir.procedure USING btree ((resource ->> 'status'));

-- Performed date/time
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_procedure_performed_date 
ON fhir.procedure USING btree (((resource ->> 'performedDateTime')::timestamp));

-- ===================================================================
-- DiagnosticReport Functional Indexes
-- ===================================================================

-- Report code
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_diagnostic_report_code 
ON fhir.diagnostic_report USING btree ((resource -> 'code' -> 'coding' -> 0 ->> 'code'));

-- Subject reference
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_diagnostic_report_subject_ref 
ON fhir.diagnostic_report USING btree ((resource -> 'subject' ->> 'reference'));

-- Report status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_diagnostic_report_status 
ON fhir.diagnostic_report USING btree ((resource ->> 'status'));

-- Effective date/time
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_diagnostic_report_effective_date 
ON fhir.diagnostic_report USING btree (((resource ->> 'effectiveDateTime')::timestamp));

-- ===================================================================
-- MedicationRequest Functional Indexes
-- ===================================================================

-- Medication code
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medication_request_code 
ON fhir.medication_request USING btree ((resource -> 'medicationCodeableConcept' -> 'coding' -> 0 ->> 'code'));

-- Subject reference
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medication_request_subject_ref 
ON fhir.medication_request USING btree ((resource -> 'subject' ->> 'reference'));

-- Request status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medication_request_status 
ON fhir.medication_request USING btree ((resource ->> 'status'));

-- Intent
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medication_request_intent 
ON fhir.medication_request USING btree ((resource ->> 'intent'));

-- Authored date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medication_request_authored_on 
ON fhir.medication_request USING btree (((resource ->> 'authoredOn')::timestamp));

-- ===================================================================
-- Composition Functional Indexes
-- ===================================================================

-- Subject reference
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_composition_subject_ref 
ON fhir.composition USING btree ((resource -> 'subject' ->> 'reference'));

-- Composition type
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_composition_type 
ON fhir.composition USING btree ((resource -> 'type' -> 'coding' -> 0 ->> 'code'));

-- Composition status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_composition_status 
ON fhir.composition USING btree ((resource ->> 'status'));

-- Composition date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_composition_date 
ON fhir.composition USING btree (((resource ->> 'date')::timestamp));

-- ===================================================================
-- AllergyIntolerance Functional Indexes
-- ===================================================================

-- Allergen code
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_allergy_intolerance_code 
ON fhir.allergy_intolerance USING btree ((resource -> 'code' -> 'coding' -> 0 ->> 'code'));

-- Patient reference
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_allergy_intolerance_patient_ref 
ON fhir.allergy_intolerance USING btree ((resource -> 'patient' ->> 'reference'));

-- Clinical status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_allergy_intolerance_clinical_status 
ON fhir.allergy_intolerance USING btree ((resource -> 'clinicalStatus' -> 'coding' -> 0 ->> 'code'));

-- Verification status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_allergy_intolerance_verification_status 
ON fhir.allergy_intolerance USING btree ((resource -> 'verificationStatus' -> 'coding' -> 0 ->> 'code'));

-- ===================================================================
-- Selective Partial GIN Indexes (for complex nested searches)
-- ===================================================================

-- Patient identifiers (array of identifier objects)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patient_identifiers_gin 
ON fhir.patient USING GIN((resource -> 'identifier'));

-- Patient names (array of name objects)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patient_names_gin 
ON fhir.patient USING GIN((resource -> 'name'));

-- Patient telecom (phone, email arrays)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patient_telecom_gin 
ON fhir.patient USING GIN((resource -> 'telecom'));

-- Observation components (for complex lab results)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_observation_component_gin 
ON fhir.observation USING GIN((resource -> 'component'));

-- Condition evidence (supporting evidence array)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_condition_evidence_gin 
ON fhir.condition USING GIN((resource -> 'evidence'));

-- ===================================================================
-- Analyze Tables for Query Planner
-- ===================================================================

ANALYZE fhir.patient;
ANALYZE fhir.observation;
ANALYZE fhir.condition;
ANALYZE fhir.encounter;
ANALYZE fhir.procedure;
ANALYZE fhir.diagnostic_report;
ANALYZE fhir.medication_request;
ANALYZE fhir.composition;
ANALYZE fhir.allergy_intolerance;
ANALYZE fhir.medication_statement;
ANALYZE fhir.family_member_history;
ANALYZE fhir.service_request;
ANALYZE fhir.appointment;
ANALYZE fhir.care_plan;

-- ===================================================================
-- CarePlan Functional Indexes
-- ===================================================================

-- Subject reference (patient)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_care_plan_subject_ref 
ON fhir.care_plan USING btree ((resource -> 'subject' ->> 'reference'));

-- CarePlan status (draft, active, on-hold, revoked, completed, etc.)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_care_plan_status 
ON fhir.care_plan USING btree ((resource ->> 'status'));

-- CarePlan intent (proposal, plan, order, option)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_care_plan_intent 
ON fhir.care_plan USING btree ((resource ->> 'intent'));

-- Category (care plan type)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_care_plan_category 
ON fhir.care_plan USING btree ((resource -> 'category' -> 0 -> 'coding' -> 0 ->> 'code'));

-- Creation date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_care_plan_created 
ON fhir.care_plan USING btree (((resource ->> 'created')::timestamp));

-- Period start
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_care_plan_period_start 
ON fhir.care_plan USING btree (((resource -> 'period' ->> 'start')::timestamp));

-- Period end
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_care_plan_period_end 
ON fhir.care_plan USING btree (((resource -> 'period' ->> 'end')::timestamp));

-- Encounter reference
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_care_plan_encounter_ref 
ON fhir.care_plan USING btree ((resource -> 'encounter' ->> 'reference'));

-- Author reference
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_care_plan_author_ref 
ON fhir.care_plan USING btree ((resource -> 'author' ->> 'reference'));

-- Care team reference
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_care_plan_care_team_ref 
ON fhir.care_plan USING btree ((resource -> 'careTeam' -> 0 ->> 'reference'));

-- Goal reference
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_care_plan_goal_ref 
ON fhir.care_plan USING btree ((resource -> 'goal' -> 0 ->> 'reference'));

-- Primary identifier value
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_care_plan_identifier_value 
ON fhir.care_plan USING btree ((resource -> 'identifier' -> 0 ->> 'value'));

-- Primary identifier system
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_care_plan_identifier_system 
ON fhir.care_plan USING btree ((resource -> 'identifier' -> 0 ->> 'system'));

-- Commit the transaction
COMMIT;

-- ===================================================================
-- Index Creation Summary
-- ===================================================================

-- Display created indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'fhir' 
  AND indexname LIKE 'idx_%_subject_ref'
  OR indexname LIKE 'idx_%_code'
  OR indexname LIKE 'idx_%_status'
  OR indexname LIKE 'idx_%_date'
ORDER BY tablename, indexname;

-- Display index sizes
SELECT 
    t.tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_tables t
LEFT JOIN pg_indexes i ON i.tablename = t.tablename
WHERE t.schemaname = 'fhir'
  AND indexname IS NOT NULL
  AND indexname LIKE 'idx_%'
ORDER BY pg_relation_size(indexrelid) DESC;

-- ===================================================================
-- Performance Testing Queries
-- ===================================================================

-- Test patient search by family name
EXPLAIN (ANALYZE, BUFFERS) 
SELECT id, resource ->> 'name' as name 
FROM fhir.patient 
WHERE resource -> 'name' -> 0 ->> 'family' = 'Smith';

-- Test observation search by code
EXPLAIN (ANALYZE, BUFFERS) 
SELECT id, resource -> 'code' as code 
FROM fhir.observation 
WHERE resource -> 'code' -> 'coding' -> 0 ->> 'code' = '8310-5';

-- Test condition search by subject
EXPLAIN (ANALYZE, BUFFERS) 
SELECT id, resource -> 'code' as code 
FROM fhir.condition 
WHERE resource -> 'subject' ->> 'reference' = 'Patient/123';

-- ===================================================================
-- Migration Complete
-- ===================================================================

SELECT 'FHIR Functional Indexes Migration Completed Successfully!' as status;
