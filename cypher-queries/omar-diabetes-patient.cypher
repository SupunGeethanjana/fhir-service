// Cypher queries for Omar Bin Khalid diabetes patient data
// Based on saudi-patient-02-omar-diabetes-enhanced.json

// Create Patient node
CREATE (patient:Patient {
  id: "patient-omar-bin-khalid-02",
  resourceType: "Patient",
  active: true,
  mrn: "SA-02345678",
  nationalId: "1054321987",
  familyName: "Bin Khalid",
  givenNames: ["Omar", "Abdulaziz"],
  gender: "male",
  birthDate: date("1965-02-20"),
  age: duration.between(date("1965-02-20"), date()).years,
  city: "Jeddah",
  country: "SA",
  primaryLanguage: "ar-SA"
})

// Create Encounter node
CREATE (encounter:Encounter {
  id: "encounter-diabetes-02",
  resourceType: "Encounter",
  status: "finished",
  class: "ambulatory",
  startDate: datetime("2025-07-23T11:00:00+03:00"),
  endDate: datetime("2025-07-23T12:00:00+03:00"),
  reasonText: "Excessive thirst, frequent urination, and unexplained weight loss for 2 weeks"
})

// Create Conditions
CREATE (diabetes:Condition {
  id: "diag-type2-diabetes-02",
  resourceType: "Condition",
  clinicalStatus: "active",
  category: "encounter-diagnosis",
  code: "E11.9",
  codeSystem: "ICD-10-CM",
  display: "Type 2 diabetes mellitus without complications",
  text: "Type 2 Diabetes Mellitus",
  onsetDate: date("2025-07-23"),
  severity: "moderate"
})

CREATE (hypertension:Condition {
  id: "diag-hypertension-02",
  resourceType: "Condition",
  clinicalStatus: "active",
  category: "encounter-diagnosis",
  code: "I10",
  codeSystem: "ICD-10-CM",
  display: "Essential (primary) hypertension",
  text: "Mild Hypertension"
})

CREATE (familyRisk:Condition {
  id: "pmh-prediabetes-02",
  resourceType: "Condition",
  clinicalStatus: "resolved",
  category: "problem-list-item",
  text: "Family History of Diabetes",
  onsetString: "Known risk factor"
})

// Create Vital Signs Observations
CREATE (bp:Observation {
  id: "obs-bp-02",
  resourceType: "Observation",
  status: "final",
  category: "vital-signs",
  code: "85354-9",
  codeSystem: "LOINC",
  display: "Blood Pressure",
  effectiveDateTime: datetime("2025-07-23T11:30:00+03:00"),
  systolic: 145,
  diastolic: 90,
  unit: "mm[Hg]",
  interpretation: "high"
})

CREATE (heartRate:Observation {
  id: "obs-hr-02",
  resourceType: "Observation",
  status: "final",
  category: "vital-signs",
  code: "8867-4",
  codeSystem: "LOINC",
  display: "Heart rate",
  effectiveDateTime: datetime("2025-07-23T11:30:00+03:00"),
  value: 88,
  unit: "beats/minute"
})

CREATE (weight:Observation {
  id: "obs-weight-02",
  resourceType: "Observation",
  status: "final",
  category: "vital-signs",
  code: "29463-7",
  codeSystem: "LOINC",
  display: "Body weight",
  effectiveDateTime: datetime("2025-07-23T11:30:00+03:00"),
  value: 88,
  unit: "kg"
})

CREATE (height:Observation {
  id: "obs-height-02",
  resourceType: "Observation",
  status: "final",
  category: "vital-signs",
  code: "8302-2",
  codeSystem: "LOINC",
  display: "Body height",
  effectiveDateTime: datetime("2025-07-23T11:30:00+03:00"),
  value: 172,
  unit: "cm"
})

CREATE (bmi:Observation {
  id: "obs-bmi-02",
  resourceType: "Observation",
  status: "final",
  category: "vital-signs",
  code: "39156-5",
  codeSystem: "LOINC",
  display: "Body mass index",
  effectiveDateTime: datetime("2025-07-23T11:30:00+03:00"),
  value: 29.7,
  unit: "kg/m2",
  interpretation: "overweight"
})

// Create Laboratory Observations
CREATE (glucose:Observation {
  id: "obs-random-glucose-02",
  resourceType: "Observation",
  status: "final",
  category: "laboratory",
  code: "2345-7",
  codeSystem: "LOINC",
  display: "Glucose [Mass/volume] in Serum or Plasma",
  effectiveDateTime: datetime("2025-07-23T11:30:00+03:00"),
  value: 285,
  unit: "mg/dL",
  interpretation: "high",
  referenceRange: "70-140 mg/dL"
})

CREATE (hba1c:Observation {
  id: "obs-hba1c-02",
  resourceType: "Observation",
  status: "final",
  category: "laboratory",
  code: "4548-4",
  codeSystem: "LOINC",
  display: "Hemoglobin A1c/Hemoglobin.total in Blood",
  effectiveDateTime: datetime("2025-07-23T11:30:00+03:00"),
  value: 11.2,
  unit: "%",
  interpretation: "high",
  target: "<7%",
  note: "Poor glycemic control"
})

// Create Social History Observations
CREATE (smoking:Observation {
  id: "social-smoking-02",
  resourceType: "Observation",
  status: "final",
  category: "social-history",
  code: "72166-2",
  codeSystem: "LOINC",
  display: "Tobacco smoking status",
  valueCode: "77176002",
  valueSystem: "SNOMED-CT",
  valueDisplay: "Smoker"
})

CREATE (alcohol:Observation {
  id: "social-alcohol-02",
  resourceType: "Observation",
  status: "final",
  category: "social-history",
  text: "Alcohol Use",
  valueString: "Occasional"
})

CREATE (exercise:Observation {
  id: "social-exercise-02",
  resourceType: "Observation",
  status: "final",
  category: "social-history",
  text: "Exercise",
  valueString: "Sedentary lifestyle"
})

CREATE (occupation:Observation {
  id: "social-occupation-02",
  resourceType: "Observation",
  status: "final",
  category: "social-history",
  text: "Occupation",
  valueString: "Businessman"
})

// Create Physical Exam Observations
CREATE (generalExam:Observation {
  id: "obs-general-exam-02",
  resourceType: "Observation",
  status: "final",
  category: "exam",
  text: "General Physical Exam",
  valueString: "Patient appears well but tired. Mucous membranes dry suggesting mild dehydration."
})

CREATE (fundoscopy:Observation {
  id: "obs-fundoscopy-02",
  resourceType: "Observation",
  status: "final",
  category: "exam",
  text: "Fundoscopic Examination",
  valueString: "Early diabetic changes noted"
})

CREATE (footExam:Observation {
  id: "obs-foot-exam-02",
  resourceType: "Observation",
  status: "final",
  category: "exam",
  text: "Diabetic Foot Examination",
  valueString: "No diabetic foot ulcers. Monofilament test normal."
})

// Create Family History
CREATE (fatherDiabetes:FamilyMemberHistory {
  id: "family-history-father-diabetes-02",
  resourceType: "FamilyMemberHistory",
  status: "completed",
  relationship: "FTH",
  relationshipDisplay: "Father",
  condition: "Type 2 Diabetes Mellitus"
})

CREATE (brother1Diabetes:FamilyMemberHistory {
  id: "family-history-brother1-diabetes-02",
  resourceType: "FamilyMemberHistory",
  status: "completed",
  relationship: "BRO",
  relationshipDisplay: "Brother",
  condition: "Type 2 Diabetes Mellitus"
})

CREATE (brother2Diabetes:FamilyMemberHistory {
  id: "family-history-brother2-diabetes-02",
  resourceType: "FamilyMemberHistory",
  status: "completed",
  relationship: "BRO",
  relationshipDisplay: "Brother",
  condition: "Type 2 Diabetes Mellitus"
})

CREATE (motherHtn:FamilyMemberHistory {
  id: "family-history-mother-htn-02",
  resourceType: "FamilyMemberHistory",
  status: "completed",
  relationship: "MTH",
  relationshipDisplay: "Mother",
  condition: "Hypertension"
})

// Create Medication Request
CREATE (metformin:MedicationRequest {
  id: "med-req-metformin-02",
  resourceType: "MedicationRequest",
  status: "active",
  intent: "order",
  medication: "Metformin",
  dosage: "500mg twice daily with meals",
  frequency: 2,
  period: 1,
  periodUnit: "day",
  doseValue: 500,
  doseUnit: "mg",
  supply: 30,
  supplyUnit: "days",
  authoredOn: date("2025-07-23")
})

// Create Service Requests
CREATE (hba1cFollowup:ServiceRequest {
  id: "svc-req-hba1c-followup-02",
  resourceType: "ServiceRequest",
  status: "active",
  intent: "order",
  category: "laboratory",
  code: "4548-4",
  text: "HbA1c Follow-up",
  occurrenceDateTime: datetime("2025-08-23T08:00:00+03:00"),
  priority: "routine",
  note: "Repeat in 4 weeks to assess response to metformin therapy"
})

CREATE (lipidPanel:ServiceRequest {
  id: "svc-req-lipid-panel-02",
  resourceType: "ServiceRequest",
  status: "active",
  intent: "order",
  category: "laboratory",
  text: "Lipid Panel",
  occurrenceDateTime: datetime("2025-08-06T08:00:00+03:00"),
  priority: "routine",
  note: "Fasting lipid profile for cardiovascular risk assessment"
})

CREATE (microalbumin:ServiceRequest {
  id: "svc-req-microalbumin-02",
  resourceType: "ServiceRequest",
  status: "active",
  intent: "order",
  category: "laboratory",
  text: "Microalbumin",
  priority: "routine",
  note: "Screening for diabetic nephropathy"
})

CREATE (ophthalmologyReferral:ServiceRequest {
  id: "svc-req-ophthalmology-referral-02",
  resourceType: "ServiceRequest",
  status: "active",
  intent: "order",
  category: "referral",
  text: "Ophthalmology Referral",
  priority: "routine",
  note: "Diabetic retinal screening and management of early diabetic changes"
})

CREATE (diabetesEducation:ServiceRequest {
  id: "svc-req-diabetes-education-02",
  resourceType: "ServiceRequest",
  status: "active",
  intent: "order",
  category: "education",
  text: "Diabetes Education",
  priority: "routine",
  note: "Comprehensive diabetes self-management education including diet, exercise, glucose monitoring, and medication compliance"
})

// Create Appointment
CREATE (followupAppt:Appointment {
  id: "appt-followup-02",
  resourceType: "Appointment",
  status: "booked",
  description: "Diabetes follow-up visit - assess response to metformin, review glucose logs, adjust treatment plan",
  start: datetime("2025-08-06T11:00:00+03:00")
})

// Create Composition (Clinical Document)
CREATE (composition:Composition {
  id: "composition-diabetes-02",
  resourceType: "Composition",
  status: "final",
  type: "11506-3",
  typeSystem: "LOINC",
  typeDisplay: "Progress note",
  date: datetime("2025-07-23T11:45:00+03:00"),
  author: "Dr. Ahmed Al-Rashid",
  title: "New Diabetes Diagnosis Visit"
})

// Create relationships between nodes
// Patient relationships
CREATE (patient)-[:HAS_ENCOUNTER]->(encounter)
CREATE (patient)-[:HAS_CONDITION]->(diabetes)
CREATE (patient)-[:HAS_CONDITION]->(hypertension)
CREATE (patient)-[:HAS_CONDITION]->(familyRisk)
CREATE (patient)-[:HAS_FAMILY_HISTORY]->(fatherDiabetes)
CREATE (patient)-[:HAS_FAMILY_HISTORY]->(brother1Diabetes)
CREATE (patient)-[:HAS_FAMILY_HISTORY]->(brother2Diabetes)
CREATE (patient)-[:HAS_FAMILY_HISTORY]->(motherHtn)
CREATE (patient)-[:HAS_MEDICATION]->(metformin)
CREATE (patient)-[:HAS_APPOINTMENT]->(followupAppt)
CREATE (patient)-[:HAS_DOCUMENT]->(composition)

// Encounter relationships
CREATE (encounter)-[:DIAGNOSED_WITH]->(diabetes)
CREATE (encounter)-[:DIAGNOSED_WITH]->(hypertension)
CREATE (encounter)-[:HAS_OBSERVATION]->(bp)
CREATE (encounter)-[:HAS_OBSERVATION]->(heartRate)
CREATE (encounter)-[:HAS_OBSERVATION]->(weight)
CREATE (encounter)-[:HAS_OBSERVATION]->(height)
CREATE (encounter)-[:HAS_OBSERVATION]->(bmi)
CREATE (encounter)-[:HAS_OBSERVATION]->(glucose)
CREATE (encounter)-[:HAS_OBSERVATION]->(hba1c)
CREATE (encounter)-[:HAS_OBSERVATION]->(generalExam)
CREATE (encounter)-[:HAS_OBSERVATION]->(fundoscopy)
CREATE (encounter)-[:HAS_OBSERVATION]->(footExam)

// Social history relationships
CREATE (patient)-[:HAS_SOCIAL_HISTORY]->(smoking)
CREATE (patient)-[:HAS_SOCIAL_HISTORY]->(alcohol)
CREATE (patient)-[:HAS_SOCIAL_HISTORY]->(exercise)
CREATE (patient)-[:HAS_SOCIAL_HISTORY]->(occupation)

// Service request relationships
CREATE (encounter)-[:ORDERED]->(hba1cFollowup)
CREATE (encounter)-[:ORDERED]->(lipidPanel)
CREATE (encounter)-[:ORDERED]->(microalbumin)
CREATE (encounter)-[:ORDERED]->(ophthalmologyReferral)
CREATE (encounter)-[:ORDERED]->(diabetesEducation)

// Medication relationships
CREATE (diabetes)-[:TREATED_WITH]->(metformin)

// Observation relationships for diabetes management
CREATE (diabetes)-[:MONITORED_BY]->(glucose)
CREATE (diabetes)-[:MONITORED_BY]->(hba1c)
CREATE (diabetes)-[:ASSESSED_BY]->(fundoscopy)
CREATE (diabetes)-[:ASSESSED_BY]->(footExam)

// Hypertension monitoring
CREATE (hypertension)-[:MONITORED_BY]->(bp)

// Risk factor relationships
CREATE (smoking)-[:RISK_FACTOR_FOR]->(diabetes)
CREATE (exercise)-[:RISK_FACTOR_FOR]->(diabetes)
CREATE (bmi)-[:RISK_FACTOR_FOR]->(diabetes)
CREATE (fatherDiabetes)-[:GENETIC_RISK_FOR]->(diabetes)
CREATE (brother1Diabetes)-[:GENETIC_RISK_FOR]->(diabetes)
CREATE (brother2Diabetes)-[:GENETIC_RISK_FOR]->(diabetes)
