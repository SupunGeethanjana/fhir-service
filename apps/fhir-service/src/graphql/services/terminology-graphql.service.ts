import { Injectable, Logger } from '@nestjs/common';
import { CodeSystemService } from '../../models/code-system/code-system.service';
import { ValueSetService } from '../../models/value-set/value-set.service';
import {
    CodeSystemSearchInput,
    CodeValidationInput,
    ConceptLookupInput,
    TerminologySearchInput,
    ValueSetDropdownInput,
    ValueSetExpandInput,
    ValueSetSearchInput,
} from '../types/terminology-input.type';
import {
    CodeSystem,
    CodeValidationResult,
    ConceptLookupResult,
    DropdownOption,
    ExpandedValueSet,
    TerminologySearchResult,
    ValueSet,
    ValueSetConcept,
    ValueSetDropdownResult,
} from '../types/terminology.type';

@Injectable()
export class TerminologyGraphQLService {
    private readonly logger = new Logger(TerminologyGraphQLService.name);

    constructor(
        private readonly codeSystemService: CodeSystemService,
        private readonly valueSetService: ValueSetService,
    ) { }

    async searchCodeSystems(input: CodeSystemSearchInput): Promise<CodeSystem[]> {
        const queryParams: any = {};

        // Build search parameters
        if (input.url) {
            queryParams.url = input.url;
        }
        if (input.name) {
            queryParams.name = input.name;
        }
        if (input.title) {
            queryParams.title = input.title;
        }
        if (input.status) {
            queryParams.status = input.status;
        }
        if (input.version) {
            queryParams.version = input.version;
        }

        // Add pagination
        if (input.count) {
            queryParams._count = input.count.toString();
        }
        if (input.offset) {
            queryParams._offset = input.offset.toString();
        }

        try {
            const bundle = await this.codeSystemService.search(queryParams);
            const codeSystems = bundle.entry?.map((entry: any) => this.mapToCodeSystem(entry.resource)) || [];
            return codeSystems;
        } catch (error) {
            this.logger.error('Error searching CodeSystems:', error);
            return [];
        }
    }

    async searchValueSets(input: ValueSetSearchInput): Promise<ValueSet[]> {
        const queryParams: any = {};

        // Build search parameters
        if (input.url) {
            queryParams.url = input.url;
        }
        if (input.name) {
            queryParams.name = input.name;
        }
        if (input.title) {
            queryParams.title = input.title;
        }
        if (input.status) {
            queryParams.status = input.status;
        }

        // Add pagination
        if (input.count) {
            queryParams._count = input.count.toString();
        }
        if (input.offset) {
            queryParams._offset = input.offset.toString();
        }

        try {
            const bundle = await this.valueSetService.search(queryParams);
            const valueSets = bundle.entry?.map((entry: any) => this.mapToValueSet(entry.resource)) || [];
            return valueSets;
        } catch (error) {
            this.logger.error('Error searching ValueSets:', error);
            return [];
        }
    }

    async getCodeSystem(id: string): Promise<CodeSystem | null> {
        try {
            const fhirResource = await this.codeSystemService.findById(id);
            return fhirResource ? this.mapToCodeSystem(fhirResource) : null;
        } catch (error) {
            this.logger.error(`Error finding CodeSystem ${id}:`, error);
            return null;
        }
    }

    async getValueSet(id: string): Promise<ValueSet | null> {
        try {
            const fhirResource = await this.valueSetService.findById(id);
            return fhirResource ? this.mapToValueSet(fhirResource) : null;
        } catch (error) {
            this.logger.error(`Error finding ValueSet ${id}:`, error);
            return null;
        }
    }

    async lookupConcept(input: ConceptLookupInput): Promise<ConceptLookupResult> {
        try {
            // Search for CodeSystem by URL instead of extracting ID
            const searchParams: any = {
                url: input.system
            };

            const bundle = await this.codeSystemService.search(searchParams);
            if (!bundle.entry || bundle.entry.length === 0) {
                return {
                    code: input.code,
                    display: '',
                    system: input.system,
                    found: false,
                };
            }

            const fhirResource = bundle.entry[0].resource;

            const concept = fhirResource.concept?.find((c: any) => c.code === input.code);
            if (!concept) {
                return {
                    code: input.code,
                    display: '',
                    system: input.system,
                    found: false,
                };
            }

            return {
                code: concept.code,
                display: concept.display,
                definition: concept.definition,
                system: input.system,
                found: true,
            };
        } catch (error) {
            this.logger.error('Error looking up concept:', error);
            return {
                code: input.code,
                display: '',
                system: input.system,
                found: false,
            };
        }
    }

    async expandValueSet(input: ValueSetExpandInput): Promise<ExpandedValueSet> {
        try {
            // Search for ValueSet by URL instead of extracting ID
            const searchParams: any = {
                url: input.url
            };

            const bundle = await this.valueSetService.search(searchParams);
            if (!bundle.entry || bundle.entry.length === 0) {
                return {
                    url: input.url,
                    version: '1.0.0',
                    contains: [],
                    total: 0,
                    offset: input.offset || 0,
                    count: input.count,
                };
            }

            // Get the first matching ValueSet
            const valueSetResource = bundle.entry[0].resource;

            let concepts: ValueSetConcept[] = [];

            // Get concepts from composed systems
            for (const include of valueSetResource.compose?.include || []) {
                // Search for CodeSystem by URL instead of extracting ID
                const codeSystemSearchParams: any = {
                    url: include.system
                };

                const codeSystemBundle = await this.codeSystemService.search(codeSystemSearchParams);
                if (codeSystemBundle.entry && codeSystemBundle.entry.length > 0) {
                    const codeSystemResource = codeSystemBundle.entry[0].resource;

                    if (include.concept && include.concept.length > 0) {
                        // Use explicit concepts from ValueSet
                        concepts.push(...include.concept.map((c: any) => ({
                            ...c,
                            system: include.system,
                        })));
                    } else {
                        // Use all concepts from CodeSystem
                        concepts.push(...(codeSystemResource.concept || []).map((c: any) => ({
                            code: c.code,
                            display: c.display,
                            system: include.system,
                        })));
                    }
                }
            }

            // Apply text filter
            if (input.filter) {
                const filterText = input.filter.toLowerCase();
                concepts = concepts.filter(c =>
                    c.code.toLowerCase().includes(filterText) ||
                    c.display.toLowerCase().includes(filterText)
                );
            }

            // Apply pagination
            const start = input.offset || 0;
            const end = start + (input.count || 100);
            const paginatedConcepts = concepts.slice(start, end);

            return {
                url: input.url,
                version: valueSetResource.version || '1.0.0',
                contains: paginatedConcepts,
                total: concepts.length,
                offset: start,
                count: input.count,
            };
        } catch (error) {
            this.logger.error('Error expanding ValueSet:', error);
            return {
                url: input.url,
                version: '1.0.0',
                contains: [],
                total: 0,
                offset: input.offset || 0,
                count: input.count,
            };
        }
    }

    async validateCode(input: CodeValidationInput): Promise<CodeValidationResult> {
        try {
            // Search for ValueSet by URL instead of extracting ID
            const searchParams: any = {
                url: input.url
            };

            const bundle = await this.valueSetService.search(searchParams);
            if (!bundle.entry || bundle.entry.length === 0) {
                return {
                    result: false,
                    message: `ValueSet ${input.url} not found`,
                    code: input.code,
                    system: input.system,
                };
            }

            const valueSetResource = bundle.entry[0].resource;

            // Check if code exists in any of the included systems
            for (const include of valueSetResource.compose?.include || []) {
                // Search for CodeSystem by URL instead of extracting ID
                const codeSystemSearchParams: any = {
                    url: include.system
                };

                const codeSystemBundle = await this.codeSystemService.search(codeSystemSearchParams);
                if (codeSystemBundle.entry && codeSystemBundle.entry.length > 0) {
                    const codeSystemResource = codeSystemBundle.entry[0].resource;

                    const concept = codeSystemResource.concept?.find((c: any) => c.code === input.code);
                    if (concept) {
                        return {
                            result: true,
                            message: 'Code is valid',
                            display: concept.display,
                            code: input.code,
                            system: include.system,
                        };
                    }
                }
            }

            return {
                result: false,
                message: `Code ${input.code} not found in ValueSet ${input.url}`,
                code: input.code,
                system: input.system,
            };
        } catch (error) {
            this.logger.error('Error validating code:', error);
            return {
                result: false,
                message: `Error validating code: ${error.message}`,
                code: input.code,
                system: input.system,
            };
        }
    }

    async searchTerminology(input: TerminologySearchInput): Promise<TerminologySearchResult> {
        try {
            let codeSystemResults: CodeSystem[] = [];
            let valueSetResults: ValueSet[] = [];

            // Build search parameters for text search
            const searchParams: any = {};
            if (input.text) {
                // Use FHIR _text parameter for full-text search
                searchParams._text = input.text;
            }

            // Add pagination
            if (input.count) {
                searchParams._count = input.count.toString();
            }
            if (input.offset) {
                searchParams._offset = input.offset.toString();
            }

            // Search in CodeSystems
            const codeSystemBundle = await this.codeSystemService.search(searchParams);
            codeSystemResults = codeSystemBundle.entry?.map((entry: any) => this.mapToCodeSystem(entry.resource)) || [];

            // Search in ValueSets
            const valueSetBundle = await this.valueSetService.search(searchParams);
            valueSetResults = valueSetBundle.entry?.map((entry: any) => this.mapToValueSet(entry.resource)) || [];

            // Filter by category if specified
            if (input.category) {
                const categoryMap: { [key: string]: string[] } = {
                    'allergies': ['allergies'],
                    'medications': ['brand-medications', 'formulary', 'route', 'frequency', 'strength', 'instructions'],
                    'procedures': ['procedures'],
                    'departments': ['departments'],
                    'specialties': ['hospital-specialties', 'medical-specialties'],
                };

                const relevantIds = categoryMap[input.category] || [];
                if (relevantIds.length > 0) {
                    codeSystemResults = codeSystemResults.filter(cs => relevantIds.includes(cs.id));
                    valueSetResults = valueSetResults.filter(vs =>
                        relevantIds.some(id => vs.id.includes(id))
                    );
                }
            }

            return {
                codeSystems: codeSystemResults,
                valueSets: valueSetResults,
                total: codeSystemResults.length + valueSetResults.length,
            };
        } catch (error) {
            this.logger.error('Error searching terminology:', error);
            return {
                codeSystems: [],
                valueSets: [],
                total: 0,
            };
        }
    }

    async getValueSetForDropdown(input: ValueSetDropdownInput): Promise<ValueSetDropdownResult> {
        try {
            // Search for ValueSet by name or URL
            let valueSet: any;
            const searchParams: any = {};

            if (input.url) {
                searchParams.url = input.url;
            } else if (input.name) {
                searchParams.name = input.name;
            } else {
                throw new Error('Either url or name must be provided');
            }

            // Search for the ValueSet
            const bundle = await this.valueSetService.search(searchParams);
            if (!bundle.entry || bundle.entry.length === 0) {
                return {
                    options: [],
                    valueSetId: input.name || '',
                    valueSetTitle: '',
                    total: 0,
                };
            }

            // Get the first matching ValueSet
            valueSet = bundle.entry[0].resource;

            // Expand the ValueSet to get all concepts
            const expandInput: ValueSetExpandInput = {
                url: valueSet.url,
                count: input.limit || 100,
                offset: 0,
                filter: input.filter,
            };

            const expanded = await this.expandValueSet(expandInput);

            // Convert to dropdown options
            let options: DropdownOption[] = expanded.contains.map(concept => ({
                value: concept.code,
                label: concept.display,
                description: concept.display, // Use display as description since definition is not available
                system: concept.system,
            }));

            // Apply filtering if specified
            if (input.filter) {
                const filterLower = input.filter.toLowerCase();
                options = options.filter(option =>
                    option.label.toLowerCase().includes(filterLower) ||
                    option.value.toLowerCase().includes(filterLower) ||
                    (option.description && option.description.toLowerCase().includes(filterLower))
                );
            }

            // Apply sorting
            if (input.sortBy) {
                options.sort((a, b) => {
                    let aValue: string;
                    let bValue: string;

                    switch (input.sortBy) {
                        case 'code':
                            aValue = a.value;
                            bValue = b.value;
                            break;
                        case 'display':
                        default:
                            aValue = a.label;
                            bValue = b.label;
                            break;
                    }

                    const comparison = aValue.localeCompare(bValue);
                    return input.sortOrder === 'desc' ? -comparison : comparison;
                });
            }

            // Apply limit
            if (input.limit && options.length > input.limit) {
                options = options.slice(0, input.limit);
            }

            return {
                options,
                valueSetId: valueSet.id,
                valueSetTitle: valueSet.title || valueSet.name,
                total: options.length,
            };

        } catch (error) {
            this.logger.error(`Error getting ValueSet for dropdown: ${error.message}`, error.stack);
            return {
                options: [],
                valueSetId: input.name || '',
                valueSetTitle: '',
                total: 0,
            };
        }
    }

    private extractIdFromUrl(url: string): string {
        // Extract ID from URL like http://terminology.hl7.org/CodeSystem/allergies -> allergies
        const parts = url.split('/');
        return parts[parts.length - 1];
    }

    private mapToCodeSystem(fhirResource: any): CodeSystem {
        return {
            id: fhirResource.id,
            url: fhirResource.url,
            name: fhirResource.name,
            title: fhirResource.title,
            status: fhirResource.status,
            version: fhirResource.version || '1.0.0',
            date: fhirResource.date || new Date().toISOString(),
            publisher: fhirResource.publisher || '',
            description: fhirResource.description || '',
            count: fhirResource.count || fhirResource.concept?.length || 0,
            concept: fhirResource.concept || [],
        };
    }

    private mapToValueSet(fhirResource: any): ValueSet {
        return {
            id: fhirResource.id,
            url: fhirResource.url,
            name: fhirResource.name,
            title: fhirResource.title,
            status: fhirResource.status,
            version: fhirResource.version || '1.0.0',
            date: fhirResource.date || new Date().toISOString(),
            publisher: fhirResource.publisher || '',
            description: fhirResource.description || '',
            purpose: fhirResource.purpose || '',
            compose: fhirResource.compose || { include: [] },
        };
    }
}
