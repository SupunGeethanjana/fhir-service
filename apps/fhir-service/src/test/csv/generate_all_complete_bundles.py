import csv
import json
import os
from datetime import datetime

def create_complete_bundle(csv_file, bundle_name, code_system_info, value_set_info):
    """Create a complete FHIR bundle with all concepts from CSV"""
    
    # Read CSV data
    concepts = []
    vs_concepts = []
    
    with open(csv_file, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            # Get the field names (first two columns)
            fields = list(row.keys())
            code_field = fields[0]
            display_field = fields[1]
            
            code = row[code_field].strip('"')
            display = row[display_field].strip('"')
            
            # CodeSystem concept
            concept = {
                "code": code,
                "display": display,
                "definition": f"{code_system_info['definition_prefix']}: {display}"
            }
            concepts.append(concept)
            
            # ValueSet concept
            vs_concept = {
                "code": code,
                "display": display
            }
            vs_concepts.append(vs_concept)
    
    # Create the bundle
    bundle = {
        "resourceType": "Bundle",
        "type": "transaction",
        "entry": [
            {
                "fullUrl": f"urn:uuid:{bundle_name}-codesystem",
                "resource": {
                    "resourceType": "CodeSystem",
                    "id": bundle_name,
                    "url": f"http://terminology.hl7.org/CodeSystem/{bundle_name}",
                    "identifier": [
                        {
                            "system": "urn:ietf:rfc:3986",
                            "value": code_system_info["oid"]
                        }
                    ],
                    "version": "1.0.0",
                    "name": code_system_info["name"],
                    "title": code_system_info["title"],
                    "status": "active",
                    "experimental": False,
                    "date": "2025-08-05",
                    "publisher": "FHIR Service",
                    "description": code_system_info["description"],
                    "caseSensitive": True,
                    "valueSet": f"http://terminology.hl7.org/ValueSet/{bundle_name}",
                    "content": "complete",
                    "count": len(concepts),
                    "concept": concepts
                },
                "request": {
                    "method": "POST",
                    "url": "CodeSystem"
                }
            },
            {
                "fullUrl": f"urn:uuid:{bundle_name}-valueset",
                "resource": {
                    "resourceType": "ValueSet",
                    "id": f"{bundle_name}-vs",
                    "url": f"http://terminology.hl7.org/ValueSet/{bundle_name}",
                    "identifier": [
                        {
                            "system": "urn:ietf:rfc:3986",
                            "value": value_set_info["oid"]
                        }
                    ],
                    "version": "1.0.0",
                    "name": value_set_info["name"],
                    "title": value_set_info["title"],
                    "status": "active",
                    "experimental": False,
                    "date": "2025-08-05",
                    "publisher": "FHIR Service",
                    "description": value_set_info["description"],
                    "purpose": value_set_info["purpose"],
                    "compose": {
                        "include": [
                            {
                                "system": f"http://terminology.hl7.org/CodeSystem/{bundle_name}",
                                "concept": vs_concepts
                            }
                        ]
                    }
                },
                "request": {
                    "method": "POST",
                    "url": "ValueSet"
                }
            }
        ]
    }
    
    return bundle

# Configuration for all bundles
bundle_configs = {
    "allergies.csv": {
        "bundle_name": "allergies",
        "code_system": {
            "oid": "urn:oid:2.16.840.1.113883.4.642.1.2001",
            "name": "Allergies",
            "title": "Allergies and Allergens",
            "description": "A comprehensive code system for allergies and allergens using SNOMED CT codes",
            "definition_prefix": "Allergy to"
        },
        "value_set": {
            "oid": "urn:oid:2.16.840.1.113883.4.642.3.2001",
            "name": "AllergiesVS",
            "title": "Allergies and Allergens Value Set",
            "description": "Value set containing all allergies and allergens for use in AllergyIntolerance resources",
            "purpose": "To provide a standardized set of allergy codes for use across FHIR resources"
        }
    },
    "brand.csv": {
        "bundle_name": "brand-medications",
        "code_system": {
            "oid": "urn:oid:2.16.840.1.113883.4.642.1.2002",
            "name": "BrandMedications",
            "title": "Brand Medications",
            "description": "A comprehensive code system for brand medications using ERP codes",
            "definition_prefix": "Brand medication"
        },
        "value_set": {
            "oid": "urn:oid:2.16.840.1.113883.4.642.3.2002",
            "name": "BrandMedicationsVS",
            "title": "Brand Medications Value Set",
            "description": "Value set containing all brand medications for use in Medication and MedicationRequest resources",
            "purpose": "To provide a standardized set of brand medication codes for use across FHIR resources"
        }
    },
    "department.csv": {
        "bundle_name": "departments",
        "code_system": {
            "oid": "urn:oid:2.16.840.1.113883.4.642.1.2003",
            "name": "Departments",
            "title": "Hospital Departments",
            "description": "A comprehensive code system for hospital departments and clinical units",
            "definition_prefix": "Department"
        },
        "value_set": {
            "oid": "urn:oid:2.16.840.1.113883.4.642.3.2003",
            "name": "DepartmentsVS",
            "title": "Hospital Departments Value Set",
            "description": "Value set containing all hospital departments for use in Organization and Location resources",
            "purpose": "To provide a standardized set of department codes for use across FHIR resources"
        }
    },
    "formulary.csv": {
        "bundle_name": "formulary",
        "code_system": {
            "oid": "urn:oid:2.16.840.1.113883.4.642.1.2004",
            "name": "Formulary",
            "title": "Generic Formulary Medications",
            "description": "A comprehensive code system for generic formulary medications",
            "definition_prefix": "Generic formulary medication"
        },
        "value_set": {
            "oid": "urn:oid:2.16.840.1.113883.4.642.3.2004",
            "name": "FormularyVS",
            "title": "Generic Formulary Medications Value Set",
            "description": "Value set containing all generic formulary medications for use in Medication and MedicationRequest resources",
            "purpose": "To provide a standardized set of formulary medication codes for use across FHIR resources"
        }
    },
    "frequency.csv": {
        "bundle_name": "frequency",
        "code_system": {
            "oid": "urn:oid:2.16.840.1.113883.4.642.1.2005",
            "name": "Frequency",
            "title": "Medication Frequency",
            "description": "A comprehensive code system for medication dosing frequency and timing",
            "definition_prefix": "Medication frequency"
        },
        "value_set": {
            "oid": "urn:oid:2.16.840.1.113883.4.642.3.2005",
            "name": "FrequencyVS",
            "title": "Medication Frequency Value Set",
            "description": "Value set containing all medication frequency codes for use in MedicationRequest and dosage instructions",
            "purpose": "To provide a standardized set of frequency codes for medication dosing instructions"
        }
    },
    "instruction.csv": {
        "bundle_name": "instructions",
        "code_system": {
            "oid": "urn:oid:2.16.840.1.113883.4.642.1.2006",
            "name": "Instructions",
            "title": "Medication Instructions",
            "description": "A comprehensive code system for medication timing and dosing instructions",
            "definition_prefix": "Medication instruction"
        },
        "value_set": {
            "oid": "urn:oid:2.16.840.1.113883.4.642.3.2006",
            "name": "InstructionsVS",
            "title": "Medication Instructions Value Set",
            "description": "Value set containing all medication instruction codes for use in MedicationRequest and dosage instructions",
            "purpose": "To provide a standardized set of instruction codes for medication timing and dosing"
        }
    },
    "procedure.csv": {
        "bundle_name": "procedures",
        "code_system": {
            "oid": "urn:oid:2.16.840.1.113883.4.642.1.2007",
            "name": "Procedures",
            "title": "Medical Procedures",
            "description": "A comprehensive code system for medical procedures and diagnostic tests",
            "definition_prefix": "Medical procedure"
        },
        "value_set": {
            "oid": "urn:oid:2.16.840.1.113883.4.642.3.2007",
            "name": "ProceduresVS",
            "title": "Medical Procedures Value Set",
            "description": "Value set containing all medical procedures for use in Procedure and ServiceRequest resources",
            "purpose": "To provide a standardized set of procedure codes for use across FHIR resources"
        }
    },
    "route.csv": {
        "bundle_name": "route",
        "code_system": {
            "oid": "urn:oid:2.16.840.1.113883.4.642.1.2008",
            "name": "Route",
            "title": "Medication Route of Administration",
            "description": "A comprehensive code system for medication routes of administration",
            "definition_prefix": "Medication route"
        },
        "value_set": {
            "oid": "urn:oid:2.16.840.1.113883.4.642.3.2008",
            "name": "RouteVS",
            "title": "Medication Route of Administration Value Set",
            "description": "Value set containing all medication routes for use in MedicationRequest and dosage instructions",
            "purpose": "To provide a standardized set of route codes for medication administration"
        }
    },
    "specialty.csv": {
        "bundle_name": "hospital-specialties",
        "code_system": {
            "oid": "urn:oid:2.16.840.1.113883.4.642.1.2009",
            "name": "HospitalSpecialties",
            "title": "Hospital Clinical Specialties",
            "description": "A comprehensive code system for hospital clinical specialties and subspecialties",
            "definition_prefix": "Clinical specialty"
        },
        "value_set": {
            "oid": "urn:oid:2.16.840.1.113883.4.642.3.2009",
            "name": "HospitalSpecialtiesVS",
            "title": "Hospital Clinical Specialties Value Set",
            "description": "Value set containing all hospital clinical specialties for use in Practitioner and PractitionerRole resources",
            "purpose": "To provide a standardized set of hospital specialty codes for use across FHIR resources"
        }
    },
    "strength.csv": {
        "bundle_name": "strength",
        "code_system": {
            "oid": "urn:oid:2.16.840.1.113883.4.642.1.2010",
            "name": "Strength",
            "title": "Medication Strength Units",
            "description": "A comprehensive code system for medication strength units and measurements",
            "definition_prefix": "Unit of medication strength"
        },
        "value_set": {
            "oid": "urn:oid:2.16.840.1.113883.4.642.3.2010",
            "name": "StrengthVS",
            "title": "Medication Strength Units Value Set",
            "description": "Value set containing all medication strength units for use in Medication and dosage instructions",
            "purpose": "To provide a standardized set of strength unit codes for medication dosing"
        }
    }
}

# Generate all bundles
for csv_file, config in bundle_configs.items():
    if os.path.exists(csv_file):
        try:
            bundle = create_complete_bundle(
                csv_file, 
                config["bundle_name"], 
                config["code_system"], 
                config["value_set"]
            )
            
            # Save to file
            output_file = f"../master-data/{config['bundle_name']}-bundle.json"
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(bundle, f, indent=4, ensure_ascii=False)
            
            concept_count = len(bundle['entry'][0]['resource']['concept'])
            print(f"✓ {csv_file}: Generated complete bundle with {concept_count:,} concepts")
            print(f"  Saved to: {config['bundle_name']}-bundle.json")
            
        except Exception as e:
            print(f"✗ {csv_file}: Error - {str(e)}")
    else:
        print(f"✗ {csv_file}: File not found")

print(f"\nGeneration complete! All bundles now contain complete data with explicit ValueSet concepts.")
