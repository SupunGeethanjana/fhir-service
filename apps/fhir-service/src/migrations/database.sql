-- ===================================================================
-- FHIR Service Database Schema
-- 
-- This file contains the complete database schema for the FHIR Service
-- application. It creates all necessary tables, indexes, and initial
-- data required for the application to function properly.

-- This script is idempotent and can be run safely multiple times.
-- It will create the schema, tables, indexes, and seed the master
-- data needed for the application to function.
--
-- Recommended Workflow:
-- 1. Manually create an empty database (e.g., 'fhir_server_prod').
-- 2. Connect to that database.
-- 3. Execute this entire script.
-- ===================================================================
--
-- Schema Design:
-- - All tables use the 'fhir' schema namespace
-- - Each FHIR resource has both a current table and a history table
-- - Current tables store the latest version of each resource
-- - History tables maintain an immutable audit trail of all versions
-- - JSONB columns enable efficient storage and querying of FHIR resources
-- - Optimized indexing strategy for performance and FHIR search capabilities
-- - Transaction module organized into specialized services for maintainability
--
-- Generated: July 30, 2025
-- Version: 3.0.0
-- Recent Changes: Added all missing FHIR resources, reorganized transaction module
-- ===================================================================

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the FHIR schema namespace
CREATE SCHEMA IF NOT EXISTS fhir;

-- ===================================================================
-- FHIR Search Parameters Configuration Table
-- ===================================================================

-- Table: fhir_search_params
-- Purpose: Drives the data-driven search functionality
-- This table defines the search parameters available for each FHIR resource type
CREATE TABLE IF NOT EXISTS fhir.fhir_search_params (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    resource_type VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    expression TEXT NOT NULL,
    description TEXT
);

-- Index for efficient search parameter lookups
CREATE INDEX IF NOT EXISTS idx_search_params_resource_name 
ON fhir.fhir_search_params (resource_type, name);

-- ===================================================================
-- FHIR Resource Tables
-- ===================================================================

-- Each FHIR resource type has two tables:
-- 1. Current table: Stores the latest version of each resource
-- 2. History table: Stores all historical versions for audit trail

-- Patient Resource Tables
-- =====================

CREATE TABLE IF NOT EXISTS fhir.patient (
    id UUID PRIMARY KEY,
    version_id INT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    txid UUID NOT NULL,
    resource JSONB NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS fhir.patient_history (
    history_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    id UUID NOT NULL,
    version_id INT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    txid UUID NOT NULL,
    resource JSONB NOT NULL
);

-- Observation Resource Tables
-- ==========================

CREATE TABLE IF NOT EXISTS fhir.observation (
    id UUID PRIMARY KEY,
    version_id INT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    txid UUID NOT NULL,
    resource JSONB NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS fhir.observation_history (
    history_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    id UUID NOT NULL,
    version_id INT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    txid UUID NOT NULL,
    resource JSONB NOT NULL
);

-- Composition Resource Tables
-- ==========================

CREATE TABLE IF NOT EXISTS fhir.composition (
    id UUID PRIMARY KEY,
    version_id INT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    txid UUID NOT NULL,
    resource JSONB NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS fhir.composition_history (
    history_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    id UUID NOT NULL,
    version_id INT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    txid UUID NOT NULL,
    resource JSONB NOT NULL
);

-- Encounter Resource Tables
-- ========================

CREATE TABLE IF NOT EXISTS fhir.encounter (
    id UUID PRIMARY KEY,
    version_id INT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    txid UUID NOT NULL,
    resource JSONB NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS fhir.encounter_history (
    history_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    id UUID NOT NULL,
    version_id INT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    txid UUID NOT NULL,
    resource JSONB NOT NULL
);

-- Condition Resource Tables
-- ========================

CREATE TABLE IF NOT EXISTS fhir.condition (
    id UUID PRIMARY KEY,
    version_id INT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    txid UUID NOT NULL,
    resource JSONB NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS fhir.condition_history (
    history_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    id UUID NOT NULL,
    version_id INT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    txid UUID NOT NULL,
    resource JSONB NOT NULL
);

-- Procedure Resource Tables
-- ========================

CREATE TABLE IF NOT EXISTS fhir.procedure (
    id UUID PRIMARY KEY,
    version_id INT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    txid UUID NOT NULL,
    resource JSONB NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS fhir.procedure_history (
    history_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    id UUID NOT NULL,
    version_id INT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    txid UUID NOT NULL,
    resource JSONB NOT NULL
);

-- MedicationStatement Resource Tables
-- ==================================

CREATE TABLE IF NOT EXISTS fhir.medication_statement (
    id UUID PRIMARY KEY,
    version_id INT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    txid UUID NOT NULL,
    resource JSONB NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS fhir.medication_statement_history (
    history_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    id UUID NOT NULL,
    version_id INT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    txid UUID NOT NULL,
    resource JSONB NOT NULL
);

-- FamilyMemberHistory Resource Tables
-- ==================================

CREATE TABLE IF NOT EXISTS fhir.family_member_history (
    id UUID PRIMARY KEY,
    version_id INT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    txid UUID NOT NULL,
    resource JSONB NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS fhir.family_member_history_history (
    history_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    id UUID NOT NULL,
    version_id INT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    txid UUID NOT NULL,
    resource JSONB NOT NULL
);

-- DiagnosticReport Resource Tables
-- ===============================

CREATE TABLE IF NOT EXISTS fhir.diagnostic_report (
    id UUID PRIMARY KEY,
    version_id INT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    txid UUID NOT NULL,
    resource JSONB NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS fhir.diagnostic_report_history (
    history_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    id UUID NOT NULL,
    version_id INT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    txid UUID NOT NULL,
    resource JSONB NOT NULL
);

-- AllergyIntolerance Resource Tables
-- =================================

CREATE TABLE IF NOT EXISTS fhir.allergy_intolerance (
    id UUID PRIMARY KEY,
    version_id INT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    txid UUID NOT NULL,
    resource JSONB NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS fhir.allergy_intolerance_history (
    history_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    id UUID NOT NULL,
    version_id INT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    txid UUID NOT NULL,
    resource JSONB NOT NULL
);

-- CodeSystem Resource Tables
-- ===========================

CREATE TABLE IF NOT EXISTS fhir.code_system (
    id UUID PRIMARY KEY,
    version_id INT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    txid UUID NOT NULL,
    resource JSONB NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS fhir.code_system_history (
    history_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    id UUID NOT NULL,
    version_id INT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    txid UUID NOT NULL,
    resource JSONB NOT NULL
);

-- ValueSet Resource Tables
-- =========================

CREATE TABLE IF NOT EXISTS fhir.value_set (
    id UUID PRIMARY KEY,
    version_id INT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    txid UUID NOT NULL,
    resource JSONB NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS fhir.value_set_history (
    history_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    id UUID NOT NULL,
    version_id INT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    txid UUID NOT NULL,
    resource JSONB NOT NULL
);

-- MedicationRequest Resource Tables
-- ================================

CREATE TABLE IF NOT EXISTS fhir.medication_request (
    id UUID PRIMARY KEY,
    version_id INT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    txid UUID NOT NULL,
    resource JSONB NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS fhir.medication_request_history (
    history_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    id UUID NOT NULL,
    version_id INT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    txid UUID NOT NULL,
    resource JSONB NOT NULL
);

-- ServiceRequest Resource Tables
-- =============================

CREATE TABLE IF NOT EXISTS fhir.service_request (
    id UUID PRIMARY KEY,
    version_id INT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    txid UUID NOT NULL,
    resource JSONB NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS fhir.service_request_history (
    history_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    id UUID NOT NULL,
    version_id INT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    txid UUID NOT NULL,
    resource JSONB NOT NULL
);

-- Appointment Resource Tables
-- ==========================

CREATE TABLE IF NOT EXISTS fhir.appointment (
    id UUID PRIMARY KEY,
    version_id INT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    txid UUID NOT NULL,
    resource JSONB NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS fhir.appointment_history (
    history_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    id UUID NOT NULL,
    version_id INT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    txid UUID NOT NULL,
    resource JSONB NOT NULL
);

-- CarePlan Resource Tables
-- ========================

CREATE TABLE IF NOT EXISTS fhir.care_plan (
    id UUID PRIMARY KEY,
    version_id INT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    txid UUID NOT NULL,
    resource JSONB NOT NULL,
    deleted_at TIMESTAMPTZ,
    subject_id UUID,
    encounter_id UUID
);

CREATE TABLE IF NOT EXISTS fhir.care_plan_history (
    history_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    id UUID NOT NULL,
    version_id INT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    txid UUID NOT NULL,
    resource JSONB NOT NULL,
    superseded_at TIMESTAMPTZ,
    subject_id UUID,
    encounter_id UUID
);

-- Practitioner Resource Tables
-- ============================

CREATE TABLE IF NOT EXISTS fhir.practitioner (
    id UUID PRIMARY KEY,
    version_id INT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    txid UUID NOT NULL,
    resource JSONB NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS fhir.practitioner_history (
    resource_id UUID NOT NULL,
    version_id INT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    txid UUID NOT NULL,
    resource JSONB NOT NULL,
    deleted_at TIMESTAMPTZ,
    PRIMARY KEY (resource_id, version_id)
);

-- Organization Resource Tables
-- ============================

CREATE TABLE IF NOT EXISTS fhir.organization (
    id UUID PRIMARY KEY,
    version_id INT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    txid UUID NOT NULL,
    resource JSONB NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS fhir.organization_history (
    history_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    id UUID NOT NULL,
    version_id INT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    txid UUID NOT NULL,
    resource JSONB NOT NULL
);

-- Location Resource Tables
-- ========================

CREATE TABLE IF NOT EXISTS fhir.location (
    id UUID PRIMARY KEY,
    version_id INT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    txid UUID NOT NULL,
    resource JSONB NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS fhir.location_history (
    history_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    id UUID NOT NULL,
    version_id INT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    txid UUID NOT NULL,
    resource JSONB NOT NULL
);

-- Device Resource Tables
-- ======================

CREATE TABLE IF NOT EXISTS fhir.device (
    id UUID PRIMARY KEY,
    version_id INT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    txid UUID NOT NULL,
    resource JSONB NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS fhir.device_history (
    history_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    id UUID NOT NULL,
    version_id INT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    txid UUID NOT NULL,
    resource JSONB NOT NULL
);

-- Medication Resource Tables
-- ==========================

CREATE TABLE IF NOT EXISTS fhir.medication (
    id UUID PRIMARY KEY,
    version_id INT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    txid UUID NOT NULL,
    resource JSONB NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS fhir.medication_history (
    history_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    id UUID NOT NULL,
    version_id INT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    txid UUID NOT NULL,
    resource JSONB NOT NULL
);

-- Specimen Resource Tables
-- ========================

CREATE TABLE IF NOT EXISTS fhir.specimen (
    id UUID PRIMARY KEY,
    version_id INT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    txid UUID NOT NULL,
    resource JSONB NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS fhir.specimen_history (
    history_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    id UUID NOT NULL,
    version_id INT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    txid UUID NOT NULL,
    resource JSONB NOT NULL
);

-- ===================================================================
-- Performance Indexes
-- ===================================================================

-- Note: Removed GIN indexes on resource columns due to PostgreSQL size limitations with large JSONB values
-- For FHIR resource searches, consider implementing application-level search parameters or functional indexes

-- Transaction ID indexes for current tables (enable fast transaction lookups)
CREATE INDEX IF NOT EXISTS idx_patient_txid ON fhir.patient (txid);
CREATE INDEX IF NOT EXISTS idx_observation_txid ON fhir.observation (txid);
CREATE INDEX IF NOT EXISTS idx_composition_txid ON fhir.composition (txid);
CREATE INDEX IF NOT EXISTS idx_encounter_txid ON fhir.encounter (txid);
CREATE INDEX IF NOT EXISTS idx_condition_txid ON fhir.condition (txid);
CREATE INDEX IF NOT EXISTS idx_procedure_txid ON fhir.procedure (txid);
CREATE INDEX IF NOT EXISTS idx_medication_statement_txid ON fhir.medication_statement (txid);
CREATE INDEX IF NOT EXISTS idx_family_member_history_txid ON fhir.family_member_history (txid);
CREATE INDEX IF NOT EXISTS idx_diagnostic_report_txid ON fhir.diagnostic_report (txid);
CREATE INDEX IF NOT EXISTS idx_allergy_intolerance_txid ON fhir.allergy_intolerance (txid);
CREATE INDEX IF NOT EXISTS idx_code_system_txid ON fhir.code_system (txid);
CREATE INDEX IF NOT EXISTS idx_value_set_txid ON fhir.value_set (txid);
CREATE INDEX IF NOT EXISTS idx_medication_request_txid ON fhir.medication_request (txid);
CREATE INDEX IF NOT EXISTS idx_service_request_txid ON fhir.service_request (txid);
CREATE INDEX IF NOT EXISTS idx_appointment_txid ON fhir.appointment (txid);
CREATE INDEX IF NOT EXISTS idx_practitioner_txid ON fhir.practitioner (txid);
CREATE INDEX IF NOT EXISTS idx_organization_txid ON fhir.organization (txid);
CREATE INDEX IF NOT EXISTS idx_location_txid ON fhir.location (txid);
CREATE INDEX IF NOT EXISTS idx_device_txid ON fhir.device (txid);
CREATE INDEX IF NOT EXISTS idx_medication_txid ON fhir.medication (txid);
CREATE INDEX IF NOT EXISTS idx_specimen_txid ON fhir.specimen (txid);

-- ===================================================================
-- Functional Indexes for FHIR Search Parameters
-- ===================================================================

-- CodeSystem functional indexes for common search parameters
CREATE INDEX IF NOT EXISTS idx_code_system_status ON fhir.code_system USING BTREE ((resource ->> 'status'));
CREATE INDEX IF NOT EXISTS idx_code_system_name ON fhir.code_system USING BTREE ((resource ->> 'name'));
CREATE INDEX IF NOT EXISTS idx_code_system_url ON fhir.code_system USING BTREE ((resource ->> 'url'));
CREATE INDEX IF NOT EXISTS idx_code_system_title ON fhir.code_system USING BTREE ((resource ->> 'title'));
CREATE INDEX IF NOT EXISTS idx_code_system_version ON fhir.code_system USING BTREE ((resource ->> 'version'));
CREATE INDEX IF NOT EXISTS idx_code_system_publisher ON fhir.code_system USING BTREE ((resource ->> 'publisher'));
CREATE INDEX IF NOT EXISTS idx_code_system_identifier_value ON fhir.code_system USING BTREE ((resource -> 'identifier' -> 0 ->> 'value'));

-- ValueSet functional indexes for common search parameters  
CREATE INDEX IF NOT EXISTS idx_value_set_status ON fhir.value_set USING BTREE ((resource ->> 'status'));
CREATE INDEX IF NOT EXISTS idx_value_set_name ON fhir.value_set USING BTREE ((resource ->> 'name'));
CREATE INDEX IF NOT EXISTS idx_value_set_url ON fhir.value_set USING BTREE ((resource ->> 'url'));
CREATE INDEX IF NOT EXISTS idx_value_set_title ON fhir.value_set USING BTREE ((resource ->> 'title'));
CREATE INDEX IF NOT EXISTS idx_value_set_version ON fhir.value_set USING BTREE ((resource ->> 'version'));
CREATE INDEX IF NOT EXISTS idx_value_set_publisher ON fhir.value_set USING BTREE ((resource ->> 'publisher'));
CREATE INDEX IF NOT EXISTS idx_value_set_identifier_value ON fhir.value_set USING BTREE ((resource -> 'identifier' -> 0 ->> 'value'));

-- Patient functional indexes for common search parameters
CREATE INDEX IF NOT EXISTS idx_patient_name_family ON fhir.patient USING BTREE ((resource -> 'name' -> 0 ->> 'family'));
CREATE INDEX IF NOT EXISTS idx_patient_name_given ON fhir.patient USING BTREE ((resource -> 'name' -> 0 -> 'given' -> 0));
CREATE INDEX IF NOT EXISTS idx_patient_gender ON fhir.patient USING BTREE ((resource ->> 'gender'));
CREATE INDEX IF NOT EXISTS idx_patient_birthdate ON fhir.patient USING BTREE ((resource ->> 'birthDate'));
CREATE INDEX IF NOT EXISTS idx_patient_active ON fhir.patient USING BTREE ((resource ->> 'active'));
CREATE INDEX IF NOT EXISTS idx_patient_identifier_value ON fhir.patient USING BTREE ((resource -> 'identifier' -> 0 ->> 'value'));

-- Observation functional indexes for common search parameters
CREATE INDEX IF NOT EXISTS idx_observation_status ON fhir.observation USING BTREE ((resource ->> 'status'));
CREATE INDEX IF NOT EXISTS idx_observation_code ON fhir.observation USING BTREE ((resource -> 'code' -> 'coding' -> 0 ->> 'code'));
CREATE INDEX IF NOT EXISTS idx_observation_effective_datetime ON fhir.observation USING BTREE ((resource ->> 'effectiveDateTime'));
CREATE INDEX IF NOT EXISTS idx_observation_subject_reference ON fhir.observation USING BTREE ((resource -> 'subject' ->> 'reference'));

-- Organization functional indexes for common search parameters
CREATE INDEX IF NOT EXISTS idx_organization_name ON fhir.organization USING BTREE ((resource ->> 'name'));
CREATE INDEX IF NOT EXISTS idx_organization_active ON fhir.organization USING BTREE ((resource ->> 'active'));
CREATE INDEX IF NOT EXISTS idx_organization_identifier_value ON fhir.organization USING BTREE ((resource -> 'identifier' -> 0 ->> 'value'));

-- Location functional indexes for common search parameters
CREATE INDEX IF NOT EXISTS idx_location_name ON fhir.location USING BTREE ((resource ->> 'name'));
CREATE INDEX IF NOT EXISTS idx_location_status ON fhir.location USING BTREE ((resource ->> 'status'));
CREATE INDEX IF NOT EXISTS idx_location_identifier_value ON fhir.location USING BTREE ((resource -> 'identifier' -> 0 ->> 'value'));

-- Encounter functional indexes for common search parameters
CREATE INDEX IF NOT EXISTS idx_encounter_status ON fhir.encounter USING BTREE ((resource ->> 'status'));
CREATE INDEX IF NOT EXISTS idx_encounter_class ON fhir.encounter USING BTREE ((resource -> 'class' ->> 'code'));
CREATE INDEX IF NOT EXISTS idx_encounter_subject_reference ON fhir.encounter USING BTREE ((resource -> 'subject' ->> 'reference'));
CREATE INDEX IF NOT EXISTS idx_encounter_period_start ON fhir.encounter USING BTREE ((resource -> 'period' ->> 'start'));
CREATE INDEX IF NOT EXISTS idx_encounter_type ON fhir.encounter USING BTREE ((resource -> 'type' -> 0 -> 'coding' -> 0 ->> 'code'));
CREATE INDEX IF NOT EXISTS idx_encounter_identifier_value ON fhir.encounter USING BTREE ((resource -> 'identifier' -> 0 ->> 'value'));

-- Condition functional indexes for common search parameters
CREATE INDEX IF NOT EXISTS idx_condition_subject_reference ON fhir.condition USING BTREE ((resource -> 'subject' ->> 'reference'));
CREATE INDEX IF NOT EXISTS idx_condition_code ON fhir.condition USING BTREE ((resource -> 'code' -> 'coding' -> 0 ->> 'code'));
CREATE INDEX IF NOT EXISTS idx_condition_clinical_status ON fhir.condition USING BTREE ((resource -> 'clinicalStatus' -> 'coding' -> 0 ->> 'code'));
CREATE INDEX IF NOT EXISTS idx_condition_verification_status ON fhir.condition USING BTREE ((resource -> 'verificationStatus' -> 'coding' -> 0 ->> 'code'));
CREATE INDEX IF NOT EXISTS idx_condition_category ON fhir.condition USING BTREE ((resource -> 'category' -> 0 -> 'coding' -> 0 ->> 'code'));
CREATE INDEX IF NOT EXISTS idx_condition_onset_datetime ON fhir.condition USING BTREE ((resource ->> 'onsetDateTime'));
CREATE INDEX IF NOT EXISTS idx_condition_recorded_date ON fhir.condition USING BTREE ((resource ->> 'recordedDate'));

-- Procedure functional indexes for common search parameters
CREATE INDEX IF NOT EXISTS idx_procedure_subject_reference ON fhir.procedure USING BTREE ((resource -> 'subject' ->> 'reference'));
CREATE INDEX IF NOT EXISTS idx_procedure_code ON fhir.procedure USING BTREE ((resource -> 'code' -> 'coding' -> 0 ->> 'code'));
CREATE INDEX IF NOT EXISTS idx_procedure_status ON fhir.procedure USING BTREE ((resource ->> 'status'));
CREATE INDEX IF NOT EXISTS idx_procedure_performed_datetime ON fhir.procedure USING BTREE ((resource ->> 'performedDateTime'));
CREATE INDEX IF NOT EXISTS idx_procedure_category ON fhir.procedure USING BTREE ((resource -> 'category' -> 'coding' -> 0 ->> 'code'));
CREATE INDEX IF NOT EXISTS idx_procedure_encounter_reference ON fhir.procedure USING BTREE ((resource -> 'encounter' ->> 'reference'));

-- MedicationStatement functional indexes for common search parameters
CREATE INDEX IF NOT EXISTS idx_medication_statement_subject_reference ON fhir.medication_statement USING BTREE ((resource -> 'subject' ->> 'reference'));
CREATE INDEX IF NOT EXISTS idx_medication_statement_status ON fhir.medication_statement USING BTREE ((resource ->> 'status'));
CREATE INDEX IF NOT EXISTS idx_medication_statement_medication_code ON fhir.medication_statement USING BTREE ((resource -> 'medicationCodeableConcept' -> 'coding' -> 0 ->> 'code'));
CREATE INDEX IF NOT EXISTS idx_medication_statement_effective_datetime ON fhir.medication_statement USING BTREE ((resource ->> 'effectiveDateTime'));
CREATE INDEX IF NOT EXISTS idx_medication_statement_identifier_value ON fhir.medication_statement USING BTREE ((resource -> 'identifier' -> 0 ->> 'value'));

-- MedicationRequest functional indexes for common search parameters
CREATE INDEX IF NOT EXISTS idx_medication_request_subject_reference ON fhir.medication_request USING BTREE ((resource -> 'subject' ->> 'reference'));
CREATE INDEX IF NOT EXISTS idx_medication_request_status ON fhir.medication_request USING BTREE ((resource ->> 'status'));
CREATE INDEX IF NOT EXISTS idx_medication_request_intent ON fhir.medication_request USING BTREE ((resource ->> 'intent'));
CREATE INDEX IF NOT EXISTS idx_medication_request_medication_code ON fhir.medication_request USING BTREE ((resource -> 'medicationCodeableConcept' -> 'coding' -> 0 ->> 'code'));
CREATE INDEX IF NOT EXISTS idx_medication_request_authored_on ON fhir.medication_request USING BTREE ((resource ->> 'authoredOn'));
CREATE INDEX IF NOT EXISTS idx_medication_request_identifier_value ON fhir.medication_request USING BTREE ((resource -> 'identifier' -> 0 ->> 'value'));

-- ServiceRequest functional indexes for common search parameters
CREATE INDEX IF NOT EXISTS idx_service_request_subject_reference ON fhir.service_request USING BTREE ((resource -> 'subject' ->> 'reference'));
CREATE INDEX IF NOT EXISTS idx_service_request_status ON fhir.service_request USING BTREE ((resource ->> 'status'));
CREATE INDEX IF NOT EXISTS idx_service_request_intent ON fhir.service_request USING BTREE ((resource ->> 'intent'));
CREATE INDEX IF NOT EXISTS idx_service_request_code ON fhir.service_request USING BTREE ((resource -> 'code' -> 'coding' -> 0 ->> 'code'));
CREATE INDEX IF NOT EXISTS idx_service_request_authored_on ON fhir.service_request USING BTREE ((resource ->> 'authoredOn'));
CREATE INDEX IF NOT EXISTS idx_service_request_identifier_value ON fhir.service_request USING BTREE ((resource -> 'identifier' -> 0 ->> 'value'));

-- DiagnosticReport functional indexes for common search parameters
CREATE INDEX IF NOT EXISTS idx_diagnostic_report_subject_reference ON fhir.diagnostic_report USING BTREE ((resource -> 'subject' ->> 'reference'));
CREATE INDEX IF NOT EXISTS idx_diagnostic_report_status ON fhir.diagnostic_report USING BTREE ((resource ->> 'status'));
CREATE INDEX IF NOT EXISTS idx_diagnostic_report_code ON fhir.diagnostic_report USING BTREE ((resource -> 'code' -> 'coding' -> 0 ->> 'code'));
CREATE INDEX IF NOT EXISTS idx_diagnostic_report_effective_datetime ON fhir.diagnostic_report USING BTREE ((resource ->> 'effectiveDateTime'));
CREATE INDEX IF NOT EXISTS idx_diagnostic_report_category ON fhir.diagnostic_report USING BTREE ((resource -> 'category' -> 0 -> 'coding' -> 0 ->> 'code'));
CREATE INDEX IF NOT EXISTS idx_diagnostic_report_identifier_value ON fhir.diagnostic_report USING BTREE ((resource -> 'identifier' -> 0 ->> 'value'));

-- AllergyIntolerance functional indexes for common search parameters
CREATE INDEX IF NOT EXISTS idx_allergy_intolerance_patient_reference ON fhir.allergy_intolerance USING BTREE ((resource -> 'patient' ->> 'reference'));
CREATE INDEX IF NOT EXISTS idx_allergy_intolerance_code ON fhir.allergy_intolerance USING BTREE ((resource -> 'code' -> 'coding' -> 0 ->> 'code'));
CREATE INDEX IF NOT EXISTS idx_allergy_intolerance_clinical_status ON fhir.allergy_intolerance USING BTREE ((resource -> 'clinicalStatus' -> 'coding' -> 0 ->> 'code'));
CREATE INDEX IF NOT EXISTS idx_allergy_intolerance_verification_status ON fhir.allergy_intolerance USING BTREE ((resource -> 'verificationStatus' -> 'coding' -> 0 ->> 'code'));
CREATE INDEX IF NOT EXISTS idx_allergy_intolerance_type ON fhir.allergy_intolerance USING BTREE ((resource ->> 'type'));
CREATE INDEX IF NOT EXISTS idx_allergy_intolerance_category ON fhir.allergy_intolerance USING BTREE ((resource -> 'category' -> 0));
CREATE INDEX IF NOT EXISTS idx_allergy_intolerance_criticality ON fhir.allergy_intolerance USING BTREE ((resource ->> 'criticality'));

-- FamilyMemberHistory functional indexes for common search parameters
CREATE INDEX IF NOT EXISTS idx_family_member_history_patient_reference ON fhir.family_member_history USING BTREE ((resource -> 'patient' ->> 'reference'));
CREATE INDEX IF NOT EXISTS idx_family_member_history_status ON fhir.family_member_history USING BTREE ((resource ->> 'status'));
CREATE INDEX IF NOT EXISTS idx_family_member_history_relationship ON fhir.family_member_history USING BTREE ((resource -> 'relationship' -> 'coding' -> 0 ->> 'code'));
CREATE INDEX IF NOT EXISTS idx_family_member_history_condition_code ON fhir.family_member_history USING BTREE ((resource -> 'condition' -> 0 -> 'code' -> 'coding' -> 0 ->> 'code'));
CREATE INDEX IF NOT EXISTS idx_family_member_history_date ON fhir.family_member_history USING BTREE ((resource ->> 'date'));
CREATE INDEX IF NOT EXISTS idx_family_member_history_identifier_value ON fhir.family_member_history USING BTREE ((resource -> 'identifier' -> 0 ->> 'value'));

-- Composition functional indexes for common search parameters
CREATE INDEX IF NOT EXISTS idx_composition_subject_reference ON fhir.composition USING BTREE ((resource -> 'subject' ->> 'reference'));
CREATE INDEX IF NOT EXISTS idx_composition_status ON fhir.composition USING BTREE ((resource ->> 'status'));
CREATE INDEX IF NOT EXISTS idx_composition_type ON fhir.composition USING BTREE ((resource -> 'type' -> 'coding' -> 0 ->> 'code'));
CREATE INDEX IF NOT EXISTS idx_composition_date ON fhir.composition USING BTREE ((resource ->> 'date'));
CREATE INDEX IF NOT EXISTS idx_composition_title ON fhir.composition USING BTREE ((resource ->> 'title'));
CREATE INDEX IF NOT EXISTS idx_composition_category ON fhir.composition USING BTREE ((resource -> 'category' -> 0 -> 'coding' -> 0 ->> 'code'));
CREATE INDEX IF NOT EXISTS idx_composition_encounter_reference ON fhir.composition USING BTREE ((resource -> 'encounter' ->> 'reference'));
CREATE INDEX IF NOT EXISTS idx_composition_identifier_value ON fhir.composition USING BTREE ((resource -> 'identifier' ->> 'value'));

-- Appointment functional indexes for common search parameters
CREATE INDEX IF NOT EXISTS idx_appointment_status ON fhir.appointment USING BTREE ((resource ->> 'status'));
CREATE INDEX IF NOT EXISTS idx_appointment_start ON fhir.appointment USING BTREE ((resource ->> 'start'));
CREATE INDEX IF NOT EXISTS idx_appointment_end ON fhir.appointment USING BTREE ((resource ->> 'end'));
CREATE INDEX IF NOT EXISTS idx_appointment_type ON fhir.appointment USING BTREE ((resource -> 'appointmentType' -> 'coding' -> 0 ->> 'code'));
CREATE INDEX IF NOT EXISTS idx_appointment_service_type ON fhir.appointment USING BTREE ((resource -> 'serviceType' -> 0 -> 'coding' -> 0 ->> 'code'));
CREATE INDEX IF NOT EXISTS idx_appointment_specialty ON fhir.appointment USING BTREE ((resource -> 'specialty' -> 0 -> 'coding' -> 0 ->> 'code'));
CREATE INDEX IF NOT EXISTS idx_appointment_identifier_value ON fhir.appointment USING BTREE ((resource -> 'identifier' -> 0 ->> 'value'));

-- Practitioner functional indexes for common search parameters
CREATE INDEX IF NOT EXISTS idx_practitioner_name_family ON fhir.practitioner USING BTREE ((resource -> 'name' -> 0 ->> 'family'));
CREATE INDEX IF NOT EXISTS idx_practitioner_name_given ON fhir.practitioner USING BTREE ((resource -> 'name' -> 0 -> 'given' -> 0));
CREATE INDEX IF NOT EXISTS idx_practitioner_active ON fhir.practitioner USING BTREE ((resource ->> 'active'));
CREATE INDEX IF NOT EXISTS idx_practitioner_gender ON fhir.practitioner USING BTREE ((resource ->> 'gender'));
CREATE INDEX IF NOT EXISTS idx_practitioner_qualification_code ON fhir.practitioner USING BTREE ((resource -> 'qualification' -> 0 -> 'code' -> 'coding' -> 0 ->> 'code'));
CREATE INDEX IF NOT EXISTS idx_practitioner_identifier_value ON fhir.practitioner USING BTREE ((resource -> 'identifier' -> 0 ->> 'value'));

-- Device functional indexes for common search parameters
CREATE INDEX IF NOT EXISTS idx_device_status ON fhir.device USING BTREE ((resource ->> 'status'));
CREATE INDEX IF NOT EXISTS idx_device_type ON fhir.device USING BTREE ((resource -> 'type' -> 'coding' -> 0 ->> 'code'));
CREATE INDEX IF NOT EXISTS idx_device_manufacturer ON fhir.device USING BTREE ((resource ->> 'manufacturer'));
CREATE INDEX IF NOT EXISTS idx_device_model ON fhir.device USING BTREE ((resource ->> 'modelNumber'));
CREATE INDEX IF NOT EXISTS idx_device_patient_reference ON fhir.device USING BTREE ((resource -> 'patient' ->> 'reference'));
CREATE INDEX IF NOT EXISTS idx_device_location_reference ON fhir.device USING BTREE ((resource -> 'location' ->> 'reference'));
CREATE INDEX IF NOT EXISTS idx_device_identifier_value ON fhir.device USING BTREE ((resource -> 'identifier' -> 0 ->> 'value'));

-- Medication functional indexes for common search parameters
CREATE INDEX IF NOT EXISTS idx_medication_status ON fhir.medication USING BTREE ((resource ->> 'status'));
CREATE INDEX IF NOT EXISTS idx_medication_code ON fhir.medication USING BTREE ((resource -> 'code' -> 'coding' -> 0 ->> 'code'));
CREATE INDEX IF NOT EXISTS idx_medication_form ON fhir.medication USING BTREE ((resource -> 'form' -> 'coding' -> 0 ->> 'code'));
CREATE INDEX IF NOT EXISTS idx_medication_manufacturer_reference ON fhir.medication USING BTREE ((resource -> 'manufacturer' ->> 'reference'));
CREATE INDEX IF NOT EXISTS idx_medication_ingredient_code ON fhir.medication USING BTREE ((resource -> 'ingredient' -> 0 -> 'itemCodeableConcept' -> 'coding' -> 0 ->> 'code'));
CREATE INDEX IF NOT EXISTS idx_medication_identifier_value ON fhir.medication USING BTREE ((resource -> 'identifier' -> 0 ->> 'value'));

-- Specimen functional indexes for common search parameters
CREATE INDEX IF NOT EXISTS idx_specimen_status ON fhir.specimen USING BTREE ((resource ->> 'status'));
CREATE INDEX IF NOT EXISTS idx_specimen_type ON fhir.specimen USING BTREE ((resource -> 'type' -> 'coding' -> 0 ->> 'code'));
CREATE INDEX IF NOT EXISTS idx_specimen_subject_reference ON fhir.specimen USING BTREE ((resource -> 'subject' ->> 'reference'));
CREATE INDEX IF NOT EXISTS idx_specimen_collected_datetime ON fhir.specimen USING BTREE ((resource -> 'collection' ->> 'collectedDateTime'));
CREATE INDEX IF NOT EXISTS idx_specimen_collector_reference ON fhir.specimen USING BTREE ((resource -> 'collection' -> 'collector' ->> 'reference'));
CREATE INDEX IF NOT EXISTS idx_specimen_container_type ON fhir.specimen USING BTREE ((resource -> 'container' -> 0 -> 'type' -> 'coding' -> 0 ->> 'code'));
CREATE INDEX IF NOT EXISTS idx_specimen_identifier_value ON fhir.specimen USING BTREE ((resource -> 'identifier' -> 0 ->> 'value'));

-- Resource ID indexes for history tables (enable fast historical lookups)
CREATE INDEX IF NOT EXISTS idx_patient_history_id ON fhir.patient_history (id);
CREATE INDEX IF NOT EXISTS idx_observation_history_id ON fhir.observation_history (id);
CREATE INDEX IF NOT EXISTS idx_composition_history_id ON fhir.composition_history (id);
CREATE INDEX IF NOT EXISTS idx_encounter_history_id ON fhir.encounter_history (id);
CREATE INDEX IF NOT EXISTS idx_condition_history_id ON fhir.condition_history (id);
CREATE INDEX IF NOT EXISTS idx_procedure_history_id ON fhir.procedure_history (id);
CREATE INDEX IF NOT EXISTS idx_medication_statement_history_id ON fhir.medication_statement_history (id);
CREATE INDEX IF NOT EXISTS idx_family_member_history_history_id ON fhir.family_member_history_history (id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_report_history_id ON fhir.diagnostic_report_history (id);
CREATE INDEX IF NOT EXISTS idx_allergy_intolerance_history_id ON fhir.allergy_intolerance_history (id);
CREATE INDEX IF NOT EXISTS idx_code_system_history_id ON fhir.code_system_history (id);
CREATE INDEX IF NOT EXISTS idx_value_set_history_id ON fhir.value_set_history (id);
CREATE INDEX IF NOT EXISTS idx_medication_request_history_id ON fhir.medication_request_history (id);
CREATE INDEX IF NOT EXISTS idx_service_request_history_id ON fhir.service_request_history (id);
CREATE INDEX IF NOT EXISTS idx_appointment_history_id ON fhir.appointment_history (id);
CREATE INDEX IF NOT EXISTS idx_practitioner_history_resource_id ON fhir.practitioner_history (resource_id);
CREATE INDEX IF NOT EXISTS idx_organization_history_id ON fhir.organization_history (id);
CREATE INDEX IF NOT EXISTS idx_location_history_id ON fhir.location_history (id);
CREATE INDEX IF NOT EXISTS idx_device_history_id ON fhir.device_history (id);
CREATE INDEX IF NOT EXISTS idx_medication_history_id ON fhir.medication_history (id);
CREATE INDEX IF NOT EXISTS idx_specimen_history_id ON fhir.specimen_history (id);

-- Transaction ID indexes for history tables (enable fast transaction history lookups)
CREATE INDEX IF NOT EXISTS idx_patient_history_txid ON fhir.patient_history (txid);
CREATE INDEX IF NOT EXISTS idx_observation_history_txid ON fhir.observation_history (txid);
CREATE INDEX IF NOT EXISTS idx_composition_history_txid ON fhir.composition_history (txid);
CREATE INDEX IF NOT EXISTS idx_encounter_history_txid ON fhir.encounter_history (txid);
CREATE INDEX IF NOT EXISTS idx_condition_history_txid ON fhir.condition_history (txid);
CREATE INDEX IF NOT EXISTS idx_procedure_history_txid ON fhir.procedure_history (txid);
CREATE INDEX IF NOT EXISTS idx_medication_statement_history_txid ON fhir.medication_statement_history (txid);
CREATE INDEX IF NOT EXISTS idx_family_member_history_history_txid ON fhir.family_member_history_history (txid);
CREATE INDEX IF NOT EXISTS idx_diagnostic_report_history_txid ON fhir.diagnostic_report_history (txid);
CREATE INDEX IF NOT EXISTS idx_allergy_intolerance_history_txid ON fhir.allergy_intolerance_history (txid);
CREATE INDEX IF NOT EXISTS idx_code_system_history_txid ON fhir.code_system_history (txid);
CREATE INDEX IF NOT EXISTS idx_value_set_history_txid ON fhir.value_set_history (txid);
CREATE INDEX IF NOT EXISTS idx_medication_request_history_txid ON fhir.medication_request_history (txid);
CREATE INDEX IF NOT EXISTS idx_service_request_history_txid ON fhir.service_request_history (txid);
CREATE INDEX IF NOT EXISTS idx_appointment_history_txid ON fhir.appointment_history (txid);
CREATE INDEX IF NOT EXISTS idx_practitioner_history_txid ON fhir.practitioner_history (txid);
CREATE INDEX IF NOT EXISTS idx_organization_history_txid ON fhir.organization_history (txid);
CREATE INDEX IF NOT EXISTS idx_location_history_txid ON fhir.location_history (txid);
CREATE INDEX IF NOT EXISTS idx_device_history_txid ON fhir.device_history (txid);
CREATE INDEX IF NOT EXISTS idx_medication_history_txid ON fhir.medication_history (txid);
CREATE INDEX IF NOT EXISTS idx_specimen_history_txid ON fhir.specimen_history (txid);

-- ===================================================================
-- Initial Data - FHIR Search Parameters
-- ===================================================================

-- Clear existing search parameters and insert updated ones with JSONPath expressions
DELETE FROM fhir.fhir_search_params;

-- Patient Search Parameters (JSONPath format for compatibility with GenericSearchService)
INSERT INTO fhir.fhir_search_params (resource_type, name, type, expression, description) VALUES
('Patient', '_id', 'token', '$.id', 'Search by the logical id of the resource'),
('Patient', 'identifier', 'token', '$.identifier[*].value', 'Search by a patient identifier (e.g., MRN)'),
('Patient', 'name', 'string', '$.name[*].family', 'Search by patient family name'),
('Patient', 'family', 'string', '$.name[*].family', 'Search by patient family name'),
('Patient', 'given', 'string', '$.name[*].given[*]', 'Search by patient given name'),
('Patient', 'gender', 'token', '$.gender', 'Search by patient gender'),
('Patient', 'birthdate', 'date', '$.birthDate', 'Search by patient birth date'),
('Patient', 'active', 'token', '$.active', 'Search by patient active status'),
('Patient', 'phone', 'token', '$.telecom[?(@.system=="phone")].value', 'Search by patient phone number'),
('Patient', 'email', 'token', '$.telecom[?(@.system=="email")].value', 'Search by patient email address'),
('Patient', 'address', 'string', '$.address[*].text', 'Search by patient address'),
('Patient', 'address-city', 'string', '$.address[*].city', 'Search by patient city'),
('Patient', 'address-state', 'string', '$.address[*].state', 'Search by patient state'),
('Patient', 'address-postalcode', 'string', '$.address[*].postalCode', 'Search by patient postal code'),
('Patient', 'address-country', 'string', '$.address[*].country', 'Search by patient country'),
('Patient', 'deceased', 'token', '$.deceasedBoolean', 'Search by patient deceased status');

-- Observation Search Parameters (JSONPath format)
INSERT INTO fhir.fhir_search_params (resource_type, name, type, expression, description) VALUES
('Observation', '_id', 'token', '$.id', 'Search by the logical id of the resource'),
('Observation', 'code', 'token', '$.code.coding[*].code', 'Search by the observation code'),
('Observation', 'date', 'date', '$.effectiveDateTime', 'Search by the observation date'),
('Observation', 'subject', 'reference', '$.subject.reference', 'Search by the subject reference (e.g., Patient/123)'),
('Observation', 'patient', 'reference', '$.subject.reference', 'Search by the patient reference'),
('Observation', 'status', 'token', '$.status', 'Search by observation status'),
('Observation', 'category', 'token', '$.category[*].coding[*].code', 'Search by observation category'),
('Observation', 'value-string', 'string', '$.valueString', 'Search by observation value (string)'),
('Observation', 'value-quantity', 'quantity', '$.valueQuantity.value', 'Search by observation value (quantity)'),
('Observation', 'value-code', 'token', '$.valueCodeableConcept.coding[*].code', 'Search by observation value (coded)'),
('Observation', 'encounter', 'reference', '$.encounter.reference', 'Search by encounter reference'),
('Observation', 'performer', 'reference', '$.performer[*].reference', 'Search by observation performer');

-- Encounter Search Parameters (JSONPath format)
INSERT INTO fhir.fhir_search_params (resource_type, name, type, expression, description) VALUES
('Encounter', '_id', 'token', '$.id', 'Search by the logical id of the resource'),
('Encounter', 'subject', 'reference', '$.subject.reference', 'Search by the subject of the encounter'),
('Encounter', 'patient', 'reference', '$.subject.reference', 'Search by the patient of the encounter'),
('Encounter', 'date', 'date', '$.period.start', 'Search by encounter start date'),
('Encounter', 'status', 'token', '$.status', 'Search by encounter status'),
('Encounter', 'class', 'token', '$.class.code', 'Search by encounter class'),
('Encounter', 'type', 'token', '$.type[*].coding[*].code', 'Search by encounter type'),
('Encounter', 'service-provider', 'reference', '$.serviceProvider.reference', 'Search by service provider'),
('Encounter', 'practitioner', 'reference', '$.participant[*].individual.reference', 'Search by participating practitioner'),
('Encounter', 'location', 'reference', '$.location[*].location.reference', 'Search by encounter location');

-- Composition Search Parameters (JSONPath format)
INSERT INTO fhir.fhir_search_params (resource_type, name, type, expression, description) VALUES
('Composition', '_id', 'token', '$.id', 'Search by the logical id of the resource'),
('Composition', 'subject', 'reference', '$.subject.reference', 'Search for notes about a specific patient'),
('Composition', 'patient', 'reference', '$.subject.reference', 'Search for notes about a specific patient'),
('Composition', 'date', 'date', '$.date', 'Search for notes based on their composition date'),
('Composition', 'type', 'token', '$.type.coding[*].code', 'Search for notes by their type (e.g., Progress Note)'),
('Composition', 'status', 'token', '$.status', 'Search by composition status'),
('Composition', 'title', 'string', '$.title', 'Search by composition title'),
('Composition', 'author', 'reference', '$.author[*].reference', 'Search by composition author'),
('Composition', 'encounter', 'reference', '$.encounter.reference', 'Search by encounter reference'),
('Composition', 'category', 'token', '$.category[*].coding[*].code', 'Search by composition category'),
('Composition', 'confidentiality', 'token', '$.confidentiality', 'Search by composition confidentiality'),
('Composition', 'custodian', 'reference', '$.custodian.reference', 'Search by composition custodian');

-- Condition Search Parameters (JSONPath format)
INSERT INTO fhir.fhir_search_params (resource_type, name, type, expression, description) VALUES
('Condition', '_id', 'token', '$.id', 'Search by the logical id of the resource'),
('Condition', 'subject', 'reference', '$.subject.reference', 'Search by the subject of the condition'),
('Condition', 'patient', 'reference', '$.subject.reference', 'Search by the patient of the condition'),
('Condition', 'code', 'token', '$.code.coding[*].code', 'Search by condition code'),
('Condition', 'clinical-status', 'token', '$.clinicalStatus.coding[*].code', 'Search by clinical status'),
('Condition', 'verification-status', 'token', '$.verificationStatus.coding[*].code', 'Search by verification status'),
('Condition', 'category', 'token', '$.category[*].coding[*].code', 'Search by condition category'),
('Condition', 'severity', 'token', '$.severity.coding[*].code', 'Search by condition severity'),
('Condition', 'onset-date', 'date', '$.onsetDateTime', 'Search by condition onset date'),
('Condition', 'recorded-date', 'date', '$.recordedDate', 'Search by condition recorded date'),
('Condition', 'encounter', 'reference', '$.encounter.reference', 'Search by encounter reference'),
('Condition', 'asserter', 'reference', '$.asserter.reference', 'Search by condition asserter');

-- Procedure Search Parameters (JSONPath format)
INSERT INTO fhir.fhir_search_params (resource_type, name, type, expression, description) VALUES
('Procedure', '_id', 'token', '$.id', 'Search by the logical id of the resource'),
('Procedure', 'subject', 'reference', '$.subject.reference', 'Search by the subject of the procedure'),
('Procedure', 'patient', 'reference', '$.subject.reference', 'Search by the patient of the procedure'),
('Procedure', 'code', 'token', '$.code.coding[*].code', 'Search by procedure code'),
('Procedure', 'date', 'date', '$.performedDateTime', 'Search by procedure date'),
('Procedure', 'status', 'token', '$.status', 'Search by procedure status'),
('Procedure', 'category', 'token', '$.category.coding[*].code', 'Search by procedure category'),
('Procedure', 'encounter', 'reference', '$.encounter.reference', 'Search by encounter reference'),
('Procedure', 'performer', 'reference', '$.performer[*].actor.reference', 'Search by procedure performer'),
('Procedure', 'location', 'reference', '$.location.reference', 'Search by procedure location'),
('Procedure', 'reason-code', 'token', '$.reasonCode[*].coding[*].code', 'Search by procedure reason code'),
('Procedure', 'reason-reference', 'reference', '$.reasonReference[*].reference', 'Search by procedure reason reference');

-- MedicationStatement Search Parameters (JSONPath format)
INSERT INTO fhir.fhir_search_params (resource_type, name, type, expression, description) VALUES
('MedicationStatement', '_id', 'token', '$.id', 'Search by the logical id of the resource'),
('MedicationStatement', 'subject', 'reference', '$.subject.reference', 'Search by the subject of the medication statement'),
('MedicationStatement', 'medication', 'token', '$.medicationCodeableConcept.coding[*].code', 'Search by medication code'),
('MedicationStatement', 'status', 'token', '$.status', 'Search by medication statement status'),
('MedicationStatement', 'effective', 'date', '$.effectiveDateTime', 'Search by effective date');

-- FamilyMemberHistory Search Parameters (JSONPath format)
INSERT INTO fhir.fhir_search_params (resource_type, name, type, expression, description) VALUES
('FamilyMemberHistory', '_id', 'token', '$.id', 'Search by the logical id of the resource'),
('FamilyMemberHistory', 'patient', 'reference', '$.patient.reference', 'Search by the patient of the family member history'),
('FamilyMemberHistory', 'relationship', 'token', '$.relationship.coding[*].code', 'Search by relationship code'),
('FamilyMemberHistory', 'status', 'token', '$.status', 'Search by family member history status');

-- DiagnosticReport Search Parameters (JSONPath format)
INSERT INTO fhir.fhir_search_params (resource_type, name, type, expression, description) VALUES
('DiagnosticReport', '_id', 'token', '$.id', 'Search by the logical id of the resource'),
('DiagnosticReport', 'subject', 'reference', '$.subject.reference', 'Search by the subject of the diagnostic report'),
('DiagnosticReport', 'code', 'token', '$.code.coding[*].code', 'Search by diagnostic report code'),
('DiagnosticReport', 'date', 'date', '$.effectiveDateTime', 'Search by diagnostic report date'),
('DiagnosticReport', 'status', 'token', '$.status', 'Search by diagnostic report status');

-- AllergyIntolerance Search Parameters (JSONPath format)
INSERT INTO fhir.fhir_search_params (resource_type, name, type, expression, description) VALUES
('AllergyIntolerance', '_id', 'token', '$.id', 'Search by the logical id of the resource'),
('AllergyIntolerance', 'patient', 'reference', '$.patient.reference', 'Search by the patient of the allergy intolerance'),
('AllergyIntolerance', 'code', 'token', '$.code.coding[*].code', 'Search by allergen code'),
('AllergyIntolerance', 'clinical-status', 'token', '$.clinicalStatus.coding[*].code', 'Search by clinical status'),
('AllergyIntolerance', 'verification-status', 'token', '$.verificationStatus.coding[*].code', 'Search by verification status');

-- MedicationRequest Search Parameters (JSONPath format)
INSERT INTO fhir.fhir_search_params (resource_type, name, type, expression, description) VALUES
('MedicationRequest', '_id', 'token', '$.id', 'Search by the logical id of the resource'),
('MedicationRequest', 'subject', 'reference', '$.subject.reference', 'Search by the subject of the medication request'),
('MedicationRequest', 'medication', 'token', '$.medicationCodeableConcept.coding[*].code', 'Search by medication code'),
('MedicationRequest', 'status', 'token', '$.status', 'Search by medication request status'),
('MedicationRequest', 'intent', 'token', '$.intent', 'Search by medication request intent'),
('MedicationRequest', 'authored-on', 'date', '$.authoredOn', 'Search by authored date');

-- ServiceRequest Search Parameters (JSONPath format)
INSERT INTO fhir.fhir_search_params (resource_type, name, type, expression, description) VALUES
('ServiceRequest', '_id', 'token', '$.id', 'Search by the logical id of the resource'),
('ServiceRequest', 'subject', 'reference', '$.subject.reference', 'Search by the subject of the service request'),
('ServiceRequest', 'code', 'token', '$.code.coding[*].code', 'Search by service request code'),
('ServiceRequest', 'status', 'token', '$.status', 'Search by service request status'),
('ServiceRequest', 'intent', 'token', '$.intent', 'Search by service request intent'),
('ServiceRequest', 'authored-on', 'date', '$.authoredOn', 'Search by authored date');

-- Appointment Search Parameters (JSONPath format)
INSERT INTO fhir.fhir_search_params (resource_type, name, type, expression, description) VALUES
('Appointment', '_id', 'token', '$.id', 'Search by the logical id of the resource'),
('Appointment', 'actor', 'reference', '$.participant[*].actor.reference', 'Search by appointment participant'),
('Appointment', 'date', 'date', '$.start', 'Search by appointment start date'),
('Appointment', 'status', 'token', '$.status', 'Search by appointment status'),
('Appointment', 'appointment-type', 'token', '$.appointmentType.coding[*].code', 'Search by appointment type'),
('Appointment', 'service-type', 'token', '$.serviceType[*].coding[*].code', 'Search by service type');

-- Practitioner Search Parameters (JSONPath format)
INSERT INTO fhir.fhir_search_params (resource_type, name, type, expression, description) VALUES
('Practitioner', '_id', 'token', '$.id', 'Search by the logical id of the resource'),
('Practitioner', 'identifier', 'token', '$.identifier[*].value', 'Search by practitioner identifier'),
('Practitioner', 'name', 'string', '$.name[*].family', 'Search by practitioner family name'),
('Practitioner', 'given', 'string', '$.name[*].given[*]', 'Search by practitioner given name'),
('Practitioner', 'active', 'token', '$.active', 'Search by practitioner active status'),
('Practitioner', 'qualification', 'token', '$.qualification[*].code.coding[*].code', 'Search by practitioner qualification');

-- Organization Search Parameters (JSONPath format)
INSERT INTO fhir.fhir_search_params (resource_type, name, type, expression, description) VALUES
('Organization', '_id', 'token', '$.id', 'Search by the logical id of the resource'),
('Organization', 'identifier', 'token', '$.identifier[*].value', 'Search by organization identifier'),
('Organization', 'name', 'string', '$.name', 'Search by organization name'),
('Organization', 'type', 'token', '$.type[*].coding[*].code', 'Search by organization type'),
('Organization', 'active', 'token', '$.active', 'Search by organization active status'),
('Organization', 'address-city', 'string', '$.address[*].city', 'Search by organization city'),
('Organization', 'address-state', 'string', '$.address[*].state', 'Search by organization state');

-- Location Search Parameters (JSONPath format)
INSERT INTO fhir.fhir_search_params (resource_type, name, type, expression, description) VALUES
('Location', '_id', 'token', '$.id', 'Search by the logical id of the resource'),
('Location', 'identifier', 'token', '$.identifier[*].value', 'Search by location identifier'),
('Location', 'name', 'string', '$.name', 'Search by location name'),
('Location', 'type', 'token', '$.type[*].coding[*].code', 'Search by location type'),
('Location', 'status', 'token', '$.status', 'Search by location status'),
('Location', 'organization', 'reference', '$.managingOrganization.reference', 'Search by managing organization'),
('Location', 'address-city', 'string', '$.address.city', 'Search by location city'),
('Location', 'address-state', 'string', '$.address.state', 'Search by location state');

-- Device Search Parameters (JSONPath format)
INSERT INTO fhir.fhir_search_params (resource_type, name, type, expression, description) VALUES
('Device', '_id', 'token', '$.id', 'Search by the logical id of the resource'),
('Device', 'identifier', 'token', '$.identifier[*].value', 'Search by device identifier'),
('Device', 'type', 'token', '$.type.coding[*].code', 'Search by device type'),
('Device', 'manufacturer', 'string', '$.manufacturer', 'Search by device manufacturer'),
('Device', 'model', 'string', '$.modelNumber', 'Search by device model'),
('Device', 'status', 'token', '$.status', 'Search by device status'),
('Device', 'patient', 'reference', '$.patient.reference', 'Search by device patient'),
('Device', 'location', 'reference', '$.location.reference', 'Search by device location');

-- Medication Search Parameters (JSONPath format)
INSERT INTO fhir.fhir_search_params (resource_type, name, type, expression, description) VALUES
('Medication', '_id', 'token', '$.id', 'Search by the logical id of the resource'),
('Medication', 'identifier', 'token', '$.identifier[*].value', 'Search by medication identifier'),
('Medication', 'code', 'token', '$.code.coding[*].code', 'Search by medication code'),
('Medication', 'form', 'token', '$.form.coding[*].code', 'Search by medication form'),
('Medication', 'status', 'token', '$.status', 'Search by medication status'),
('Medication', 'manufacturer', 'reference', '$.manufacturer.reference', 'Search by medication manufacturer'),
('Medication', 'ingredient', 'token', '$.ingredient[*].itemCodeableConcept.coding[*].code', 'Search by medication ingredient');

-- Specimen Search Parameters (JSONPath format)
INSERT INTO fhir.fhir_search_params (resource_type, name, type, expression, description) VALUES
('Specimen', '_id', 'token', '$.id', 'Search by the logical id of the resource'),
('Specimen', 'identifier', 'token', '$.identifier[*].value', 'Search by specimen identifier'),
('Specimen', 'type', 'token', '$.type.coding[*].code', 'Search by specimen type'),
('Specimen', 'subject', 'reference', '$.subject.reference', 'Search by specimen subject'),
('Specimen', 'status', 'token', '$.status', 'Search by specimen status'),
('Specimen', 'collected', 'date', '$.collection.collectedDateTime', 'Search by collection date'),
('Specimen', 'container', 'token', '$.container[*].type.coding[*].code', 'Search by container type'),
('Specimen', 'collector', 'reference', '$.collection.collector.reference', 'Search by specimen collector');

-- CodeSystem Search Parameters (JSONPath format - FIXED)
INSERT INTO fhir.fhir_search_params (resource_type, name, type, expression, description) VALUES
('CodeSystem', '_id', 'token', '$.id', 'Search by the logical id of the resource'),
('CodeSystem', 'identifier', 'token', '$.identifier[*].value', 'Search by code system identifier'),
('CodeSystem', 'name', 'string', '$.name', 'Search by code system name'),
('CodeSystem', 'title', 'string', '$.title', 'Search by code system title'),
('CodeSystem', 'url', 'uri', '$.url', 'Search by code system canonical URL'),
('CodeSystem', 'version', 'token', '$.version', 'Search by code system version'),
('CodeSystem', 'status', 'token', '$.status', 'Search by code system status'),
('CodeSystem', 'publisher', 'string', '$.publisher', 'Search by code system publisher'),
('CodeSystem', 'description', 'string', '$.description', 'Search by code system description');

-- ValueSet Search Parameters (JSONPath format)
INSERT INTO fhir.fhir_search_params (resource_type, name, type, expression, description) VALUES
('ValueSet', '_id', 'token', '$.id', 'Search by the logical id of the resource'),
('ValueSet', 'identifier', 'token', '$.identifier[*].value', 'Search by value set identifier'),
('ValueSet', 'name', 'string', '$.name', 'Search by value set name'),
('ValueSet', 'title', 'string', '$.title', 'Search by value set title'),
('ValueSet', 'url', 'uri', '$.url', 'Search by value set canonical URL'),
('ValueSet', 'version', 'token', '$.version', 'Search by value set version'),
('ValueSet', 'status', 'token', '$.status', 'Search by value set status'),
('ValueSet', 'publisher', 'string', '$.publisher', 'Search by value set publisher'),
('ValueSet', 'description', 'string', '$.description', 'Search by value set description'),
('ValueSet', 'reference', 'uri', '$.compose.include[*].system', 'Search by referenced code system URL');

-- ===================================================================
-- Bundle Transaction Logging Table
-- ===================================================================

-- Table: bundle_log
-- Purpose: Track FHIR bundle transactions for audit and monitoring
-- This table provides lightweight tracking of bundle submissions without
-- storing the full bundle content, enabling efficient audit trails and analytics
CREATE TABLE IF NOT EXISTS fhir.bundle_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    txid UUID NOT NULL UNIQUE,
    bundle_type VARCHAR(50) NOT NULL, -- 'transaction', 'batch', 'document', 'collection'
    resource_count INT NOT NULL DEFAULT 0,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    processing_duration_ms INT, -- calculated: completed_at - submitted_at
    status VARCHAR(20) NOT NULL DEFAULT 'processing', -- 'success', 'failed', 'processing', 'partial'
    submitted_by VARCHAR(255), -- user/system identifier who submitted the bundle
    source_system VARCHAR(255), -- originating system identifier
    error_details JSONB, -- error information if processing failed
    bundle_summary JSONB NOT NULL, -- lightweight summary: resource types, counts, etc.
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for bundle_log table
CREATE INDEX IF NOT EXISTS idx_bundle_log_txid ON fhir.bundle_log(txid);
CREATE INDEX IF NOT EXISTS idx_bundle_log_status ON fhir.bundle_log(status);
CREATE INDEX IF NOT EXISTS idx_bundle_log_submitted_at ON fhir.bundle_log(submitted_at);
CREATE INDEX IF NOT EXISTS idx_bundle_log_bundle_type ON fhir.bundle_log(bundle_type);
CREATE INDEX IF NOT EXISTS idx_bundle_log_submitted_by ON fhir.bundle_log(submitted_by);
CREATE INDEX IF NOT EXISTS idx_bundle_log_source_system ON fhir.bundle_log(source_system);

-- GIN index for efficient JSONB queries on bundle_summary
CREATE INDEX IF NOT EXISTS idx_bundle_log_summary_gin ON fhir.bundle_log USING GIN(bundle_summary);

-- ===================================================================
-- Database Setup Complete
-- ===================================================================
-- 
-- The database schema is now ready for the FHIR Service application.
-- 
-- Summary:
-- - Created 19 FHIR resource types with current and history tables
-- - Added bundle transaction logging for audit and monitoring
-- - Added comprehensive indexing for performance
-- - Populated search parameters for all resources
-- - Enabled JSONB-based FHIR resource storage and querying
-- - Organized transaction module into specialized service folders
-- 
-- FHIR Resources Supported:
-- 1. Patient              11. MedicationRequest
-- 2. Observation          12. ServiceRequest  
-- 3. Composition          13. Appointment
-- 4. Encounter            14. Practitioner
-- 5. Condition            15. Organization
-- 6. Procedure            16. Location
-- 7. MedicationStatement  17. Device
-- 8. FamilyMemberHistory  18. Medication
-- 9. DiagnosticReport     19. Specimen
-- 10. AllergyIntolerance
-- 
-- Next steps:
-- 1. Configure the application's database connection
-- 2. Run the application to verify connectivity
-- 3. Test CRUD operations and bundle transaction processing
-- ===================================================================
