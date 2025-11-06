import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

/**
 * Medication Entity
 * 
 * Represents medications, drugs, and other pharmaceutical products
 * that can be prescribed, dispensed, or administered.
 * 
 * @see https://hl7.org/fhir/medication.html
 */
@Entity('medication')
@Index('idx_medication_txid', ['txid'])
@Index('idx_medication_status', { synchronize: false })
@Index('idx_medication_code', { synchronize: false })
@Index('idx_medication_form', { synchronize: false })
@Index('idx_medication_manufacturer', ['manufacturerId'])
@Index('idx_medication_identifier_value', { synchronize: false })
@Index('idx_medication_identifier_system', { synchronize: false })
export class Medication {
    /**
     * Primary key - FHIR resource ID
     */
    @PrimaryColumn('varchar', { length: 64 })
    id: string;

    /**
     * Transaction ID for version tracking
     */
    @Column({ type: 'varchar', length: 64 })
    txid: string;

    /**
     * Last updated timestamp
     */
    @Column({ type: 'timestamp', name: 'lastUpdated' })
    lastUpdated: Date;

    /**
     * Complete FHIR resource as JSONB
     */
    @Column({ type: 'jsonb', name: 'resource' })
    resource: any;

    /**
     * Status of the medication (active, inactive, entered-in-error)
     * Extracted for indexing and fast queries
     */
    @Column({ type: 'varchar', length: 20, nullable: true })
    status: string;

    /**
     * Medication code (RxNorm, NDC, etc.)
     * Extracted as text for indexing
     */
    @Column({ type: 'varchar', length: 100, nullable: true, name: 'medication_code' })
    medicationCode: string;

    /**
     * Medication display name
     * Extracted for indexing and fast queries
     */
    @Column({ type: 'varchar', length: 500, nullable: true, name: 'display_name' })
    displayName: string;

    /**
     * Dosage form (tablet, capsule, injection, etc.)
     * Extracted as text for indexing
     */
    @Column({ type: 'varchar', length: 100, nullable: true, name: 'dosage_form' })
    dosageForm: string;

    /**
     * Manufacturer organization ID for foreign key relationships
     */
    @Column({ type: 'varchar', length: 64, nullable: true, name: 'manufacturer_id' })
    manufacturerId: string;

    /**
     * NDC (National Drug Code) for quick indexing
     * Extracted from identifier for performance
     */
    @Column({ type: 'varchar', length: 50, nullable: true })
    ndc: string;

    /**
     * RxNorm code for quick indexing
     * Extracted from code for performance
     */
    @Column({ type: 'varchar', length: 50, nullable: true, name: 'rxnorm_code' })
    rxnormCode: string;

    /**
     * Generic name of the medication
     */
    @Column({ type: 'varchar', length: 300, nullable: true, name: 'generic_name' })
    genericName: string;

    /**
     * Brand name of the medication
     */
    @Column({ type: 'varchar', length: 300, nullable: true, name: 'brand_name' })
    brandName: string;

    /**
     * Convert database entity to FHIR Medication resource
     */
    toFhir(): any {
        return {
            ...this.resource,
            id: this.id,
            meta: {
                lastUpdated: this.lastUpdated?.toISOString(),
                versionId: '1'
            }
        };
    }

    /**
     * Create entity from FHIR Medication resource
     */
    static fromFhir(fhirResource: any, txid: string): Medication {
        const medication = new Medication();

        medication.id = fhirResource.id || '';
        medication.txid = txid;
        medication.lastUpdated = new Date();
        medication.resource = fhirResource;

        // Extract searchable fields
        medication.status = fhirResource.status;

        // Extract medication code and display name
        if (fhirResource.code && fhirResource.code.coding && fhirResource.code.coding[0]) {
            const coding = fhirResource.code.coding[0];
            medication.medicationCode = coding.code;
            medication.displayName = coding.display || fhirResource.code.text;

            // Extract specific code types
            if (coding.system === 'http://www.nlm.nih.gov/research/umls/rxnorm') {
                medication.rxnormCode = coding.code;
            }
        }

        // Extract display name from text if not from coding
        if (!medication.displayName && fhirResource.code && fhirResource.code.text) {
            medication.displayName = fhirResource.code.text;
        }

        // Extract dosage form
        if (fhirResource.form && fhirResource.form.coding && fhirResource.form.coding[0]) {
            medication.dosageForm = fhirResource.form.coding[0].code;
        }

        // Extract NDC from identifier
        if (fhirResource.identifier) {
            for (const id of fhirResource.identifier) {
                if (id.system === 'http://hl7.org/fhir/sid/ndc') {
                    medication.ndc = id.value;
                    break;
                }
            }
        }

        // Handle manufacturer reference
        if (fhirResource.manufacturer && fhirResource.manufacturer.reference) {
            const match = fhirResource.manufacturer.reference.match(/^Organization\/(.+)$/);
            if (match) {
                medication.manufacturerId = match[1];
            }
        }

        // Extract generic and brand names from extensions or ingredients
        if (fhirResource.ingredient && fhirResource.ingredient[0] && fhirResource.ingredient[0].itemCodeableConcept) {
            const ingredient = fhirResource.ingredient[0].itemCodeableConcept;
            if (ingredient.coding && ingredient.coding[0]) {
                medication.genericName = ingredient.coding[0].display;
            }
        }

        // Extract brand name from extension or use display name
        if (fhirResource.code && fhirResource.code.coding) {
            for (const coding of fhirResource.code.coding) {
                if (coding.system === 'http://hl7.org/fhir/sid/ndc' && coding.display) {
                    medication.brandName = coding.display;
                    break;
                }
            }
        }

        return medication;
    }
}


