import { Field, ObjectType } from '@nestjs/graphql';
import { FhirBundleResponseEntry } from './fhir-bundle-response-entry.type';

@ObjectType({ description: 'Generic FHIR Bundle Output' })
export class FhirBundleOutput {
    @Field(() => [FhirBundleResponseEntry], { nullable: true })
    entry?: FhirBundleResponseEntry[];

    @Field(() => Number, { nullable: true })
    total?: number;

    @Field(() => String, { nullable: true })
    resourceType?: string;

    @Field(() => String, { nullable: true })
    id?: string;

    @Field(() => String, { nullable: true })
    type?: string;
}
