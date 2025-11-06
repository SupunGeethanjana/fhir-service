import { Field, InputType } from '@nestjs/graphql';
import { GraphQLJSONObject } from 'graphql-type-json';

@InputType()
export class BundleEntryRequestInput {
    @Field()
    method: string;

    @Field()
    url: string;
}

@InputType()
export class BundleEntryInput {
    @Field({ nullable: true })
    fullUrl?: string;

    @Field(() => GraphQLJSONObject)
    resource: any; // Accepts any FHIR resource object

    @Field(() => BundleEntryRequestInput)
    request: BundleEntryRequestInput;
}

@InputType()
export class BundleInput {
    @Field()
    type: string;

    @Field()
    resourceType: string;

    @Field(() => [BundleEntryInput])
    entry: BundleEntryInput[];

    @Field({ nullable: true })
    submittedBy?: string;

    @Field({ nullable: true })
    sourceSystem?: string;
}
