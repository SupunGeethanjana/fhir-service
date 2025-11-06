import csv
import json
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

# Configuration for each bundle
bundle_configs = {
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
    }
}

# Generate brand medications bundle
csv_file = "brand.csv"
config = bundle_configs[csv_file]
bundle = create_complete_bundle(
    csv_file, 
    config["bundle_name"], 
    config["code_system"], 
    config["value_set"]
)

# Save to file
output_file = f"../master-data/{config['bundle_name']}-bundle-complete.json"
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(bundle, f, indent=4, ensure_ascii=False)

print(f"Generated complete bundle with {len(bundle['entry'][0]['resource']['concept'])} concepts")
print(f"Saved to: {output_file}")
