import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

interface CodeSystemSearchParams {
    url?: string;
    name?: string;
    title?: string;
    status?: string;
    version?: string;
    _count?: number;
}

interface ValueSetSearchParams {
    url?: string;
    name?: string;
    title?: string;
    status?: string;
    _count?: number;
}

interface ExpandParams {
    count?: number;
    offset?: number;
    filter?: string;
}

/**
 * Service for terminology operations on master data
 * Handles CodeSystem and ValueSet search, lookup, expand, and validate operations
 */
@Injectable()
export class TerminologySearchService {
    private readonly logger = new Logger(TerminologySearchService.name);
    private readonly masterDataPath = path.join(__dirname, '../../test/master-data');

    // Cache for loaded bundles to improve performance
    private bundleCache: Map<string, any> = new Map();

    constructor() {
        this.preloadBundles();
    }

    /**
     * Preload all master data bundles into memory for faster access
     */
    private async preloadBundles() {
        try {
            const bundleFiles = [
                'allergies-bundle.json',
                'brand-medications-bundle.json',
                'departments-bundle.json',
                'formulary-bundle.json',
                'frequency-bundle.json',
                'instructions-bundle.json',
                'procedures-bundle.json',
                'route-bundle.json',
                'hospital-specialties-bundle.json',
                'strength-bundle.json',
                'medical-specialties-bundle.json'
            ];

            for (const file of bundleFiles) {
                try {
                    const bundlePath = path.join(this.masterDataPath, file);
                    const bundleContent = await fs.readFile(bundlePath, 'utf-8');
                    const bundle = JSON.parse(bundleContent);
                    this.bundleCache.set(file, bundle);
                    this.logger.log(`Loaded bundle: ${file}`);
                } catch (error) {
                    this.logger.warn(`Failed to load bundle ${file}: ${error.message}`);
                }
            }

            this.logger.log(`Preloaded ${this.bundleCache.size} terminology bundles`);
        } catch (error) {
            this.logger.error(`Failed to preload bundles: ${error.message}`);
        }
    }

    /**
     * Search for CodeSystem resources
     */
    async searchCodeSystems(params: CodeSystemSearchParams) {
        const matchingCodeSystems = [];
        const count = params._count || 50;

        for (const [fileName, bundle] of this.bundleCache) {
            const codeSystemEntry = bundle.entry?.find(e => e.resource?.resourceType === 'CodeSystem');

            if (codeSystemEntry) {
                const codeSystem = codeSystemEntry.resource;

                // Apply filters
                if (params.url && codeSystem.url !== params.url) continue;
                if (params.name && !codeSystem.name?.toLowerCase().includes(params.name.toLowerCase())) continue;
                if (params.title && !codeSystem.title?.toLowerCase().includes(params.title.toLowerCase())) continue;
                if (params.status && codeSystem.status !== params.status) continue;
                if (params.version && codeSystem.version !== params.version) continue;

                matchingCodeSystems.push({
                    fullUrl: codeSystemEntry.fullUrl,
                    resource: codeSystem,
                    search: { mode: 'match' }
                });

                if (matchingCodeSystems.length >= count) break;
            }
        }

        return {
            resourceType: 'Bundle',
            type: 'searchset',
            total: matchingCodeSystems.length,
            entry: matchingCodeSystems
        };
    }

    /**
     * Get a specific CodeSystem by ID
     */
    async getCodeSystem(id: string) {
        for (const [fileName, bundle] of this.bundleCache) {
            const codeSystemEntry = bundle.entry?.find(e =>
                e.resource?.resourceType === 'CodeSystem' && e.resource?.id === id
            );

            if (codeSystemEntry) {
                return codeSystemEntry.resource;
            }
        }

        throw new NotFoundException(`CodeSystem with id '${id}' not found`);
    }

    /**
     * Search for ValueSet resources
     */
    async searchValueSets(params: ValueSetSearchParams) {
        const matchingValueSets = [];
        const count = params._count || 50;

        for (const [fileName, bundle] of this.bundleCache) {
            const valueSetEntry = bundle.entry?.find(e => e.resource?.resourceType === 'ValueSet');

            if (valueSetEntry) {
                const valueSet = valueSetEntry.resource;

                // Apply filters
                if (params.url && valueSet.url !== params.url) continue;
                if (params.name && !valueSet.name?.toLowerCase().includes(params.name.toLowerCase())) continue;
                if (params.title && !valueSet.title?.toLowerCase().includes(params.title.toLowerCase())) continue;
                if (params.status && valueSet.status !== params.status) continue;

                matchingValueSets.push({
                    fullUrl: valueSetEntry.fullUrl,
                    resource: valueSet,
                    search: { mode: 'match' }
                });

                if (matchingValueSets.length >= count) break;
            }
        }

        return {
            resourceType: 'Bundle',
            type: 'searchset',
            total: matchingValueSets.length,
            entry: matchingValueSets
        };
    }

    /**
     * Get a specific ValueSet by ID
     */
    async getValueSet(id: string) {
        for (const [fileName, bundle] of this.bundleCache) {
            const valueSetEntry = bundle.entry?.find(e =>
                e.resource?.resourceType === 'ValueSet' && e.resource?.id === id
            );

            if (valueSetEntry) {
                return valueSetEntry.resource;
            }
        }

        throw new NotFoundException(`ValueSet with id '${id}' not found`);
    }

    /**
     * Lookup a code in a CodeSystem
     */
    async lookupCode(system: string, code: string, version?: string) {
        for (const [fileName, bundle] of this.bundleCache) {
            const codeSystemEntry = bundle.entry?.find(e =>
                e.resource?.resourceType === 'CodeSystem' &&
                e.resource?.url === system &&
                (!version || e.resource?.version === version)
            );

            if (codeSystemEntry) {
                const codeSystem = codeSystemEntry.resource;
                const concept = codeSystem.concept?.find(c => c.code === code);

                if (concept) {
                    return {
                        resourceType: 'Parameters',
                        parameter: [
                            { name: 'name', valueString: codeSystem.name },
                            { name: 'version', valueString: codeSystem.version },
                            { name: 'display', valueString: concept.display },
                            { name: 'definition', valueString: concept.definition },
                            { name: 'system', valueString: system }
                        ]
                    };
                }
            }
        }

        throw new NotFoundException(`Code '${code}' not found in system '${system}'`);
    }

    /**
     * Expand a ValueSet to return all codes
     */
    async expandValueSet(url: string, params: ExpandParams) {
        const valueSet = await this.findValueSetByUrl(url);
        if (!valueSet) {
            throw new NotFoundException(`ValueSet with url '${url}' not found`);
        }

        // Get the CodeSystem that this ValueSet references
        const systemUrl = valueSet.compose?.include?.[0]?.system;
        if (!systemUrl) {
            throw new NotFoundException(`ValueSet '${url}' does not reference a CodeSystem`);
        }

        const codeSystem = await this.findCodeSystemByUrl(systemUrl);
        if (!codeSystem) {
            throw new NotFoundException(`Referenced CodeSystem '${systemUrl}' not found`);
        }

        let concepts = codeSystem.concept || [];

        // Apply filter if provided
        if (params.filter) {
            const filterLower = params.filter.toLowerCase();
            concepts = concepts.filter(c =>
                c.display?.toLowerCase().includes(filterLower) ||
                c.definition?.toLowerCase().includes(filterLower) ||
                c.code?.toLowerCase().includes(filterLower)
            );
        }

        // Apply pagination
        const offset = params.offset || 0;
        const count = params.count || 100;
        const paginatedConcepts = concepts.slice(offset, offset + count);

        const expansion = {
            identifier: `urn:uuid:${Date.now()}`,
            timestamp: new Date().toISOString(),
            total: concepts.length,
            offset: offset,
            parameter: [
                { name: 'version', valueString: codeSystem.version }
            ],
            contains: paginatedConcepts.map(concept => ({
                system: systemUrl,
                code: concept.code,
                display: concept.display
            }))
        };

        return {
            ...valueSet,
            expansion
        };
    }

    /**
     * Validate if a code is in a ValueSet
     */
    async validateCode(url: string, code: string, system?: string) {
        const valueSet = await this.findValueSetByUrl(url);
        if (!valueSet) {
            throw new NotFoundException(`ValueSet with url '${url}' not found`);
        }

        const systemUrl = system || valueSet.compose?.include?.[0]?.system;
        const codeSystem = await this.findCodeSystemByUrl(systemUrl);

        const isValid = codeSystem?.concept?.some(c => c.code === code) || false;
        const concept = codeSystem?.concept?.find(c => c.code === code);

        return {
            resourceType: 'Parameters',
            parameter: [
                { name: 'result', valueBoolean: isValid },
                { name: 'system', valueString: systemUrl },
                { name: 'code', valueString: code },
                ...(concept ? [{ name: 'display', valueString: concept.display }] : [])
            ]
        };
    }

    /**
     * Helper method to find ValueSet by URL
     */
    private async findValueSetByUrl(url: string) {
        for (const [fileName, bundle] of this.bundleCache) {
            const valueSetEntry = bundle.entry?.find(e =>
                e.resource?.resourceType === 'ValueSet' && e.resource?.url === url
            );

            if (valueSetEntry) {
                return valueSetEntry.resource;
            }
        }
        return null;
    }

    /**
     * Helper method to find CodeSystem by URL
     */
    private async findCodeSystemByUrl(url: string) {
        for (const [fileName, bundle] of this.bundleCache) {
            const codeSystemEntry = bundle.entry?.find(e =>
                e.resource?.resourceType === 'CodeSystem' && e.resource?.url === url
            );

            if (codeSystemEntry) {
                return codeSystemEntry.resource;
            }
        }
        return null;
    }
}
