// Additional Cypher queries for analyzing Omar's diabetes patient data
// These queries demonstrate various ways to query the patient graph

// 1. Get complete patient overview
MATCH (p:Patient {mrn: "SA-02345678"})
OPTIONAL MATCH (p)-[:HAS_CONDITION]->(conditions:Condition)
OPTIONAL MATCH (p)-[:HAS_ENCOUNTER]->(encounters:Encounter)
OPTIONAL MATCH (p)-[:HAS_MEDICATION]->(medications:MedicationRequest)
RETURN p.familyName + ', ' + p.givenNames[0] as patientName,
       p.age as age,
       p.gender as gender,
       collect(DISTINCT conditions.text) as conditions,
       count(DISTINCT encounters) as encounterCount,
       collect(DISTINCT medications.medication) as currentMedications;

// 2. Diabetes management timeline
MATCH (p:Patient {mrn: "SA-02345678"})-[:HAS_CONDITION]->(diabetes:Condition {text: "Type 2 Diabetes Mellitus"})
OPTIONAL MATCH (diabetes)-[:MONITORED_BY]->(obs:Observation)
OPTIONAL MATCH (diabetes)-[:TREATED_WITH]->(med:MedicationRequest)
RETURN diabetes.onsetDate as diagnosisDate,
       collect(DISTINCT {
         test: obs.display,
         value: obs.value,
         unit: obs.unit,
         date: obs.effectiveDateTime,
         interpretation: obs.interpretation
       }) as monitoringTests,
       collect(DISTINCT {
         medication: med.medication,
         dosage: med.dosage,
         startDate: med.authoredOn
       }) as treatments;

// 3. Risk factor analysis
MATCH (p:Patient {mrn: "SA-02345678"})
OPTIONAL MATCH (social:Observation)-[:RISK_FACTOR_FOR]->(diabetes:Condition {text: "Type 2 Diabetes Mellitus"})
OPTIONAL MATCH (family:FamilyMemberHistory)-[:GENETIC_RISK_FOR]->(diabetes)
OPTIONAL MATCH (vitals:Observation)-[:RISK_FACTOR_FOR]->(diabetes)
WHERE social.category = "social-history" OR vitals.display = "Body mass index"
RETURN collect(DISTINCT {
         type: "Social",
         factor: social.text + ": " + social.valueString
       }) + 
       collect(DISTINCT {
         type: "Genetic",
         factor: family.relationshipDisplay + " has " + family.condition
       }) +
       collect(DISTINCT {
         type: "Physical",
         factor: vitals.display + ": " + vitals.value + " " + vitals.unit
       }) as riskFactors;

// 4. Current vital signs and lab values
MATCH (p:Patient {mrn: "SA-02345678"})-[:HAS_ENCOUNTER]->(e:Encounter)-[:HAS_OBSERVATION]->(obs:Observation)
WHERE obs.category IN ["vital-signs", "laboratory"]
RETURN obs.display as test,
       obs.value as value,
       obs.unit as unit,
       obs.interpretation as interpretation,
       obs.effectiveDateTime as testDate,
       CASE 
         WHEN obs.interpretation = "high" THEN "⚠️ HIGH"
         WHEN obs.interpretation = "low" THEN "⚠️ LOW"
         ELSE "✓ Normal"
       END as status
ORDER BY obs.category, obs.display;

// 5. Family history diabetes pattern
MATCH (p:Patient {mrn: "SA-02345678"})-[:HAS_FAMILY_HISTORY]->(fh:FamilyMemberHistory)
WHERE fh.condition CONTAINS "Diabetes"
RETURN fh.relationshipDisplay as relationship,
       fh.condition as condition,
       count(*) as count;

// 6. Care plan and follow-up schedule
MATCH (p:Patient {mrn: "SA-02345678"})-[:HAS_ENCOUNTER]->(e:Encounter)-[:ORDERED]->(sr:ServiceRequest)
OPTIONAL MATCH (p)-[:HAS_APPOINTMENT]->(appt:Appointment)
RETURN collect(DISTINCT {
         service: sr.text,
         category: sr.category,
         scheduledDate: sr.occurrenceDateTime,
         priority: sr.priority,
         note: sr.note
       }) as orderedServices,
       collect(DISTINCT {
         description: appt.description,
         scheduledDate: appt.start,
         status: appt.status
       }) as appointments;

// 7. Diabetes complications screening
MATCH (p:Patient {mrn: "SA-02345678"})-[:HAS_CONDITION]->(diabetes:Condition {text: "Type 2 Diabetes Mellitus"})
OPTIONAL MATCH (diabetes)-[:ASSESSED_BY]->(screening:Observation)
RETURN diabetes.text as condition,
       collect({
         screening: screening.text,
         result: screening.valueString,
         date: screening.effectiveDateTime
       }) as complicationScreening;

// 8. Medication compliance and monitoring
MATCH (p:Patient {mrn: "SA-02345678"})-[:HAS_MEDICATION]->(med:MedicationRequest)
OPTIONAL MATCH (p)-[:HAS_ENCOUNTER]->(e:Encounter)-[:ORDERED]->(followup:ServiceRequest)
WHERE followup.text CONTAINS "Follow-up" OR followup.note CONTAINS "response to"
RETURN med.medication as medication,
       med.dosage as dosage,
       med.authoredOn as startDate,
       collect(DISTINCT {
         followupTest: followup.text,
         scheduledDate: followup.occurrenceDateTime,
         purpose: followup.note
       }) as monitoringPlan;

// 9. Patient summary for clinical decision support
MATCH (p:Patient {mrn: "SA-02345678"})
OPTIONAL MATCH (p)-[:HAS_CONDITION]->(conditions:Condition)
OPTIONAL MATCH (p)-[:HAS_ENCOUNTER]->(e:Encounter)-[:HAS_OBSERVATION]->(vitals:Observation)
WHERE vitals.category = "vital-signs"
OPTIONAL MATCH (p)-[:HAS_ENCOUNTER]->(e)-[:HAS_OBSERVATION]->(labs:Observation)
WHERE labs.category = "laboratory" AND labs.interpretation = "high"
OPTIONAL MATCH (p)-[:HAS_FAMILY_HISTORY]->(fh:FamilyMemberHistory)
WHERE fh.condition CONTAINS "Diabetes"
RETURN {
  patient: {
    name: p.familyName + ', ' + p.givenNames[0],
    age: p.age,
    mrn: p.mrn
  },
  activeConditions: collect(DISTINCT conditions.text),
  criticalValues: collect(DISTINCT {
    test: labs.display,
    value: labs.value + ' ' + labs.unit,
    status: labs.interpretation
  }),
  latestVitals: {
    bp: [(vitals WHERE vitals.display = "Blood Pressure") | vitals.systolic + "/" + vitals.diastolic + " mmHg"][0],
    bmi: [(vitals WHERE vitals.display = "Body mass index") | vitals.value + " " + vitals.unit][0]
  },
  familyRisk: count(fh) > 0
} as clinicalSummary;

// 10. Generate care plan recommendations based on current status
MATCH (p:Patient {mrn: "SA-02345678"})-[:HAS_CONDITION]->(diabetes:Condition {text: "Type 2 Diabetes Mellitus"})
OPTIONAL MATCH (diabetes)-[:MONITORED_BY]->(hba1c:Observation {display: "Hemoglobin A1c/Hemoglobin.total in Blood"})
OPTIONAL MATCH (p)-[:HAS_ENCOUNTER]->(e:Encounter)-[:HAS_OBSERVATION]->(bmi:Observation {display: "Body mass index"})
OPTIONAL MATCH (p)-[:HAS_SOCIAL_HISTORY]->(exercise:Observation {text: "Exercise"})
RETURN 
  CASE 
    WHEN hba1c.value > 9.0 THEN "Intensive glucose management required"
    WHEN hba1c.value > 7.0 THEN "Moderate glucose control needed" 
    ELSE "Target glucose control achieved"
  END as glucoseStatus,
  CASE 
    WHEN bmi.value > 30 THEN "Weight management critical"
    WHEN bmi.value > 25 THEN "Weight management recommended"
    ELSE "Weight within normal range"
  END as weightStatus,
  CASE 
    WHEN exercise.valueString CONTAINS "Sedentary" THEN "Exercise program essential"
    ELSE "Continue current activity level"
  END as exerciseRecommendation,
  hba1c.value as currentHbA1c,
  bmi.value as currentBMI;
