# Ayaan Project
Ayaan is an AI-Powered Healthcare Assistant that is specifically designed for Outpatient Department (OPD) doctors to enhance clinical efficiency and improve patient care delivery. The system leverages advanced AI capabilities to provide comprehensive assistance during patient examinations, enabling doctors to focus on clinical decision-making rather than system navigation.

# Project Structure
- FHIR-Service: This is a FHIR service which follows HL7 standards.

# Core Technologies
- **Backend**: Nest.js
- **Data Storage**: PostgreSQL, TypeORM


# Implementation Guidelines
- **Code Quality**: Ensure code is clean, well-commented, and follows best practices.
- **Documentation**: Maintain clear documentation for components, stores, and utilities by using JSDoc comments for functions and classes.
- **FHIR Standards**: When dealing with patient data, ensure compliance with FHIR standards. Use the FHIR resources appropriately in the application.
- **Error Handling**: Implement robust error handling, especially for API calls and AI interactions. Use try-catch blocks and provide user-friendly error messages.
- **HIPAA Compliance**: Ensure that the application complies with HIPAA regulations when handling patient data. Implement necessary security measures to protect sensitive information.
- Do not generate additional implementation documents unless developer requests.
- Always follow application structure when generating entities, resolvers and new REST APIs.
- Graphql resolvers should be implemented following the existing patterns in the codebase. Should be generated inside resolvers folder in graphql directory.
- Supporting services for resolvers should be created in the services folder inside graphql directory.