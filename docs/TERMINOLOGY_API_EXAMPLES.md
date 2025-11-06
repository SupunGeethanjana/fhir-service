# Terminology GraphQL API Examples

This document provides comprehensive JSON API call examples for all terminology-related GraphQL queries in the FHIR service.

## Table of Contents
1. [Search CodeSystems](#search-codesystems)
2. [Search ValueSets](#search-valuesets)
3. [Get CodeSystem](#get-codesystem)
4. [Get ValueSet](#get-valueset)
5. [Lookup Concept](#lookup-concept)
6. [Expand ValueSet](#expand-valueset)
7. [Validate Code](#validate-code)
8. [Search Terminology](#search-terminology)
9. [Get ValueSet for Dropdown](#get-valueset-for-dropdown)

---

## Search CodeSystems

### Basic Search
```json
{
  "query": "query SearchCodeSystems($input: CodeSystemSearchInput) { searchCodeSystems(input: $input) { id url name title status version description count concept { code display definition } } }",
  "variables": {
    "input": {
      "status": "active",
      "count": 10,
      "offset": 0
    }
  }
}
```

### Search by Name
```json
{
  "query": "query SearchCodeSystems($input: CodeSystemSearchInput) { searchCodeSystems(input: $input) { id url name title status description count } }",
  "variables": {
    "input": {
      "name": "AllergyCS",
      "count": 5
    }
  }
}
```

### Search by URL
```json
{
  "query": "query SearchCodeSystems($input: CodeSystemSearchInput) { searchCodeSystems(input: $input) { id url name title concept { code display } } }",
  "variables": {
    "input": {
      "url": "http://terminology.hl7.org/CodeSystem/allergies"
    }
  }
}
```

---

## Search ValueSets

### Basic Search
```json
{
  "query": "query SearchValueSets($input: ValueSetSearchInput) { searchValueSets(input: $input) { id url name title status version description purpose compose { include { system concept { code display } } } } }",
  "variables": {
    "input": {
      "status": "active",
      "count": 10,
      "offset": 0
    }
  }
}
```

### Search by Name
```json
{
  "query": "query SearchValueSets($input: ValueSetSearchInput) { searchValueSets(input: $input) { id url name title description } }",
  "variables": {
    "input": {
      "name": "AllergiesVS",
      "count": 5
    }
  }
}
```

### Search by Title
```json
{
  "query": "query SearchValueSets($input: ValueSetSearchInput) { searchValueSets(input: $input) { id url name title } }",
  "variables": {
    "input": {
      "title": "Allergies and Intolerances"
    }
  }
}
```

---

## Get CodeSystem

### Get by ID
```json
{
  "query": "query GetCodeSystem($id: String!) { getCodeSystem(id: $id) { id url name title status version date publisher description count concept { code display definition } } }",
  "variables": {
    "id": "allergies-code-system"
  }
}
```

### Get CodeSystem Concepts Only
```json
{
  "query": "query GetCodeSystem($id: String!) { getCodeSystem(id: $id) { name title concept { code display definition } } }",
  "variables": {
    "id": "medications-code-system"
  }
}
```

---

## Get ValueSet

### Get by ID
```json
{
  "query": "query GetValueSet($id: String!) { getValueSet(id: $id) { id url name title status version date publisher description purpose compose { include { system concept { code display } } } } }",
  "variables": {
    "id": "allergies-valueset"
  }
}
```

### Get ValueSet Structure
```json
{
  "query": "query GetValueSet($id: String!) { getValueSet(id: $id) { name title compose { include { system } } } }",
  "variables": {
    "id": "medications-valueset"
  }
}
```

---

## Lookup Concept

### Lookup Allergy Concept
```json
{
  "query": "query LookupConcept($input: ConceptLookupInput!) { lookupConcept(input: $input) { code display definition system found } }",
  "variables": {
    "input": {
      "system": "http://terminology.hl7.org/CodeSystem/allergies",
      "code": "227493005",
      "version": "1.0.0"
    }
  }
}
```

### Lookup Medication Concept
```json
{
  "query": "query LookupConcept($input: ConceptLookupInput!) { lookupConcept(input: $input) { code display definition system found } }",
  "variables": {
    "input": {
      "system": "http://terminology.hl7.org/CodeSystem/medications",
      "code": "387207008"
    }
  }
}
```

---

## Expand ValueSet

### Expand Allergies ValueSet
```json
{
  "query": "query ExpandValueSet($input: ValueSetExpandInput!) { expandValueSet(input: $input) { url version contains { code display system } total offset count } }",
  "variables": {
    "input": {
      "url": "http://terminology.hl7.org/ValueSet/allergies",
      "count": 20,
      "offset": 0
    }
  }
}
```

### Expand with Filter
```json
{
  "query": "query ExpandValueSet($input: ValueSetExpandInput!) { expandValueSet(input: $input) { url contains { code display system } total } }",
  "variables": {
    "input": {
      "url": "http://terminology.hl7.org/ValueSet/medications",
      "filter": "insulin",
      "count": 10
    }
  }
}
```

### Expand Lab Tests
```json
{
  "query": "query ExpandValueSet($input: ValueSetExpandInput!) { expandValueSet(input: $input) { url contains { code display system } total } }",
  "variables": {
    "input": {
      "url": "http://terminology.hl7.org/ValueSet/laboratory-tests",
      "count": 50,
      "offset": 0
    }
  }
}
```

---

## Validate Code

### Validate Allergy Code
```json
{
  "query": "query ValidateCode($input: CodeValidationInput!) { validateCode(input: $input) { result message display code system } }",
  "variables": {
    "input": {
      "url": "http://terminology.hl7.org/ValueSet/allergies",
      "code": "227493005",
      "system": "http://terminology.hl7.org/CodeSystem/allergies",
      "display": "Cashew nut allergy"
    }
  }
}
```

### Validate Medication Code
```json
{
  "query": "query ValidateCode($input: CodeValidationInput!) { validateCode(input: $input) { result message display code system } }",
  "variables": {
    "input": {
      "url": "http://terminology.hl7.org/ValueSet/medications",
      "code": "387207008",
      "system": "http://terminology.hl7.org/CodeSystem/medications"
    }
  }
}
```

---

## Search Terminology

### General Text Search
```json
{
  "query": "query SearchTerminology($input: TerminologySearchInput) { searchTerminology(input: $input) { codeSystems { id name title description } valueSets { id name title description } total } }",
  "variables": {
    "input": {
      "text": "allergy",
      "count": 10,
      "offset": 0
    }
  }
}
```

### Search by Category
```json
{
  "query": "query SearchTerminology($input: TerminologySearchInput) { searchTerminology(input: $input) { codeSystems { id name title } valueSets { id name title } total } }",
  "variables": {
    "input": {
      "category": "medications",
      "count": 20
    }
  }
}
```

### Search with Code
```json
{
  "query": "query SearchTerminology($input: TerminologySearchInput) { searchTerminology(input: $input) { codeSystems { id name concept { code display } } valueSets { id name } total } }",
  "variables": {
    "input": {
      "code": "387207008",
      "system": "http://terminology.hl7.org/CodeSystem/medications"
    }
  }
}
```

---

## Get ValueSet for Dropdown

### Get Allergies Dropdown
```json
{
  "query": "query GetValueSetForDropdown($input: ValueSetDropdownInput!) { getValueSetForDropdown(input: $input) { options { value label description system } valueSetId valueSetTitle total } }",
  "variables": {
    "input": {
      "name": "AllergiesVS",
      "sortBy": "display",
      "sortOrder": "asc",
      "limit": 50
    }
  }
}
```

### Get Medications Dropdown with Filter
```json
{
  "query": "query GetValueSetForDropdown($input: ValueSetDropdownInput!) { getValueSetForDropdown(input: $input) { options { value label description } valueSetTitle total } }",
  "variables": {
    "input": {
      "url": "http://terminology.hl7.org/ValueSet/medications",
      "filter": "insulin",
      "sortBy": "display",
      "limit": 20
    }
  }
}
```

### Get Lab Tests Dropdown
```json
{
  "query": "query GetValueSetForDropdown($input: ValueSetDropdownInput!) { getValueSetForDropdown(input: $input) { options { value label } valueSetTitle total } }",
  "variables": {
    "input": {
      "name": "LaboratoryTestsVS",
      "sortBy": "code",
      "sortOrder": "asc",
      "limit": 100
    }
  }
}
```

### Get Procedures Dropdown
```json
{
  "query": "query GetValueSetForDropdown($input: ValueSetDropdownInput!) { getValueSetForDropdown(input: $input) { options { value label description } valueSetTitle total } }",
  "variables": {
    "input": {
      "url": "http://terminology.hl7.org/ValueSet/procedures",
      "sortBy": "display",
      "limit": 75
    }
  }
}
```

### Get Clinics Dropdown
```json
{
  "query": "query GetValueSetForDropdown($input: ValueSetDropdownInput!) { getValueSetForDropdown(input: $input) { options { value label description } valueSetTitle total } }",
  "variables": {
    "input": {
      "name": "ClinicsVS",
      "sortBy": "display",
      "sortOrder": "asc"
    }
  }
}
```

### Get Family History Dropdown
```json
{
  "query": "query GetValueSetForDropdown($input: ValueSetDropdownInput!) { getValueSetForDropdown(input: $input) { options { value label description } valueSetTitle total } }",
  "variables": {
    "input": {
      "url": "http://terminology.hl7.org/ValueSet/family-history",
      "sortBy": "display"
    }
  }
}
```

---

## Advanced Examples

### Combined Search and Expand
```json
{
  "query": "query GetAllergyData { searchValueSets(input: { name: \"AllergiesVS\" }) { id url name title } expandValueSet(input: { url: \"http://terminology.hl7.org/ValueSet/allergies\", count: 10 }) { contains { code display system } total } }",
  "variables": {}
}
```

### Multi-ValueSet Dropdown Data
```json
{
  "query": "query GetMultipleDropdowns { allergies: getValueSetForDropdown(input: { name: \"AllergiesVS\", limit: 20 }) { options { value label } total } medications: getValueSetForDropdown(input: { name: \"MedicationsVS\", limit: 20 }) { options { value label } total } procedures: getValueSetForDropdown(input: { name: \"ProceduresVS\", limit: 20 }) { options { value label } total } }",
  "variables": {}
}
```

### Validate Multiple Codes
```json
{
  "query": "query ValidateMultipleCodes { allergyValidation: validateCode(input: { url: \"http://terminology.hl7.org/ValueSet/allergies\", code: \"227493005\", system: \"http://terminology.hl7.org/CodeSystem/allergies\" }) { result message } medicationValidation: validateCode(input: { url: \"http://terminology.hl7.org/ValueSet/medications\", code: \"387207008\", system: \"http://terminology.hl7.org/CodeSystem/medications\" }) { result message } }",
  "variables": {}
}
```

---

## HTTP Request Examples

### Using cURL
```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query GetValueSetForDropdown($input: ValueSetDropdownInput!) { getValueSetForDropdown(input: $input) { options { value label } total } }",
    "variables": {
      "input": {
        "name": "AllergiesVS",
        "sortBy": "display",
        "limit": 10
      }
    }
  }'
```

### Using Fetch API (JavaScript)
```javascript
const response = await fetch('http://localhost:3000/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: `
      query GetValueSetForDropdown($input: ValueSetDropdownInput!) {
        getValueSetForDropdown(input: $input) {
          options {
            value
            label
            description
          }
          valueSetTitle
          total
        }
      }
    `,
    variables: {
      input: {
        name: "AllergiesVS",
        sortBy: "display",
        sortOrder: "asc",
        limit: 50
      }
    }
  })
});

const data = await response.json();
console.log(data.data.getValueSetForDropdown);
```

---

## Response Examples

### Successful Dropdown Response
```json
{
  "data": {
    "getValueSetForDropdown": {
      "options": [
        {
          "value": "227493005",
          "label": "Cashew nut allergy",
          "description": "Cashew nut allergy",
          "system": "http://terminology.hl7.org/CodeSystem/allergies"
        },
        {
          "value": "91935009",
          "label": "Allergy to peanuts",
          "description": "Allergy to peanuts",
          "system": "http://terminology.hl7.org/CodeSystem/allergies"
        }
      ],
      "valueSetId": "allergies-valueset",
      "valueSetTitle": "Allergies and Intolerances Value Set",
      "total": 2
    }
  }
}
```

### Error Response
```json
{
  "errors": [
    {
      "message": "Either url or name must be provided",
      "locations": [
        {
          "line": 2,
          "column": 3
        }
      ],
      "path": [
        "getValueSetForDropdown"
      ]
    }
  ],
  "data": {
    "getValueSetForDropdown": null
  }
}
```

---

## Best Practices

1. **Always specify required parameters**: Include either `name` or `url` for ValueSet queries
2. **Use pagination**: Set appropriate `count` and `offset` values for large datasets
3. **Apply filters**: Use `filter` parameter to reduce response size
4. **Sort results**: Use `sortBy` and `sortOrder` for consistent ordering
5. **Handle errors**: Check for errors in the GraphQL response
6. **Cache responses**: Consider caching dropdown data for better performance
7. **Use specific fields**: Only request the fields you need to reduce response size

---

## Master Data ValueSet Names

Based on your master data bundle, here are the available ValueSet names:

- `AllergiesVS` - Allergies and Intolerances
- `MedicationsVS` - Medications and Treatments  
- `LaboratoryTestsVS` - Laboratory Tests and Diagnostics
- `RadiologyOrdersVS` - Radiology Orders and Imaging Studies
- `ChronicDiseasesVS` - Chronic Diseases and Conditions
- `ProceduresVS` - Medical Procedures
- `ClinicsVS` - Hospital Clinics and Departments
- `SocialHistoryVS` - Social History and Lifestyle
- `FamilyHistoryVS` - Family History Relationships and Conditions
